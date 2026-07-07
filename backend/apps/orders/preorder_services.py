"""Nghiệp vụ yêu cầu đặt trước (B2C) và chuyển thành Order waiting_stock."""

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.customers.models import CustomerAddress
from apps.dealer_products.inventory_expiry import mark_expired_inventory_batches
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.dealer_products.services import annotate_dealer_product_stock
from apps.dealers.models import DealerProfileStatus
from apps.system_config.services import get_system_settings

from .delivery_slots import validate_delivery_datetime
from .models import (
    CustomerPayment,
    CustomerPaymentMethod,
    CustomerPaymentStatus,
    CustomerPaymentType,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusHistory,
    PreOrderRequest,
    PreOrderRequestItem,
    PreOrderRequestStatus,
)
from .services import _create_cod_payment, _resolve_customer_address, generate_order_code


def _available_quantity_map(dealer, product_ids):
    """Trả dict {dealer_product_id: available_quantity}."""
    if not product_ids:
        return {}
    qs = annotate_dealer_product_stock(
        DealerProduct.objects.filter(
            id__in=product_ids,
            dealer_profile=dealer,
            status=DealerProductStatus.ACTIVE,
        )
    )
    return {p.id: int(getattr(p, "available_quantity", 0) or 0) for p in qs}


def check_items_stock(dealer, items_data):
    """Kiểm tra tồn từng dòng — items_data: [{dealer_product_id, quantity}]."""
    if not items_data:
        raise ValidationError({"items": "Danh sách sản phẩm không được rỗng."})

    product_ids = [row["dealer_product_id"] for row in items_data]
    mark_expired_inventory_batches(dealer_profile_id=dealer.id)
    available_map = _available_quantity_map(dealer, product_ids)

    results = []
    for row in items_data:
        pid = row["dealer_product_id"]
        requested = int(row["quantity"])
        if requested < 1:
            raise ValidationError({"items": "Số lượng phải >= 1."})
        available = available_map.get(pid)
        if available is None:
            raise ValidationError(
                {"items": f"Sản phẩm #{pid} không tồn tại hoặc không còn bán."}
            )
        shortfall = max(0, requested - available)
        results.append(
            {
                "dealer_product_id": pid,
                "requested_quantity": requested,
                "available_quantity": available,
                "shortfall": shortfall,
                "can_order_available": available > 0,
                "needs_preorder": shortfall > 0,
                "order_available_quantity": min(requested, available),
            }
        )
    return results


def generate_preorder_request_code(dealer_id: int) -> str:
    today = timezone.now().strftime("%Y%m%d")
    prefix = f"YC-{today}-{dealer_id:04d}"
    seq = PreOrderRequest.objects.filter(request_code__startswith=prefix).count() + 1
    return f"{prefix}-{seq:04d}"


def _validate_preorder_items(dealer, items_data):
    """items_data: list of {dealer_product, quantity} — phải vượt tồn."""
    if not items_data:
        raise ValidationError({"items": "YC phải có ít nhất một sản phẩm."})

    product_ids = [row["dealer_product"].id for row in items_data]
    available_map = _available_quantity_map(dealer, product_ids)

    validated = []
    for row in items_data:
        product = row["dealer_product"]
        quantity = int(row["quantity"])
        if product.dealer_profile_id != dealer.id:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.title}' không thuộc cửa hàng này."}
            )
        if product.status != DealerProductStatus.ACTIVE:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.title}' không còn bán."}
            )
        if quantity < 1:
            raise ValidationError({"items": "Số lượng phải >= 1."})
        available = available_map.get(product.id, 0)
        if quantity <= available:
            raise ValidationError(
                {
                    "items": (
                        f"Sản phẩm '{product.title}' đủ tồn ({available}). "
                        "Dùng đặt hàng thường thay vì YC đặt trước."
                    )
                }
            )
        validated.append(
            {
                "dealer_product": product,
                "quantity": quantity,
                "available_at_submit": available,
            }
        )
    return validated


@transaction.atomic
def create_preorder_request(
    *,
    dealer,
    customer,
    customer_address_id,
    delivery_time,
    note,
    items_data,
    user,
):
    """Customer gửi YC đặt trước — không trừ tồn."""
    if dealer.status != DealerProfileStatus.ACTIVE:
        raise ValidationError({"detail": "Cửa hàng chưa hoạt động."})

    mark_expired_inventory_batches(dealer_profile_id=dealer.id)
    validate_delivery_datetime(delivery_time)
    address = _resolve_customer_address(customer, customer_address_id)
    validated_items = _validate_preorder_items(dealer, items_data)

    preorder = PreOrderRequest.objects.create(
        request_code=generate_preorder_request_code(dealer.id),
        customer=customer,
        dealer=dealer,
        customer_address=address,
        status=PreOrderRequestStatus.SUBMITTED,
        receiver_name=address.receiver_name,
        receiver_phone=address.receiver_phone,
        delivery_address=address.address,
        requested_delivery_time=delivery_time,
        note=note or "",
    )
    for row in validated_items:
        product = row["dealer_product"]
        unit = product.supplier_product.unit if product.supplier_product_id else ""
        PreOrderRequestItem.objects.create(
            preorder_request=preorder,
            dealer_product=product,
            product_title=product.title,
            unit=unit,
            requested_quantity=row["quantity"],
            available_at_submit=row["available_at_submit"],
        )

    from .preorder_notifications import notify_preorder_submitted

    notify_preorder_submitted(preorder, actor=user)
    return preorder


def _ensure_preorder_editable(preorder):
    if preorder.status not in (
        PreOrderRequestStatus.SUBMITTED,
        PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING,
    ):
        raise ValidationError({"detail": "YC đặt trước không thể thay đổi ở trạng thái hiện tại."})


@transaction.atomic
def dealer_confirm_preorder(preorder, user, *, note=""):
    """Dealer xác nhận YC — chốt SL/ngày như customer yêu cầu."""
    if preorder.status != PreOrderRequestStatus.SUBMITTED:
        raise ValidationError({"detail": "Chỉ xác nhận YC đang chờ đại lý."})

    preorder.confirmed_delivery_time = preorder.requested_delivery_time
    preorder.proposed_delivery_time = None
    preorder.dealer_note = note or ""
    preorder.status = PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING
    preorder.save(
        update_fields=[
            "confirmed_delivery_time",
            "proposed_delivery_time",
            "dealer_note",
            "status",
            "updated_at",
        ]
    )
    for item in preorder.items.all():
        item.confirmed_quantity = item.requested_quantity
        item.proposed_quantity = None
        item.save(update_fields=["confirmed_quantity", "proposed_quantity"])

    from .preorder_notifications import notify_preorder_dealer_confirmed

    notify_preorder_dealer_confirmed(preorder, actor=user)
    return preorder


@transaction.atomic
def dealer_propose_preorder(
    preorder,
    user,
    *,
    proposed_delivery_time=None,
    item_quantities=None,
    note="",
):
    """Dealer đề xuất SL và/hoặc ngày giao khác."""
    if preorder.status != PreOrderRequestStatus.SUBMITTED:
        raise ValidationError({"detail": "Chỉ đề xuất trên YC đang chờ đại lý."})

    item_quantities = item_quantities or {}
    has_qty_change = False
    for item in preorder.items.select_related("dealer_product"):
        proposed_qty = item_quantities.get(str(item.id)) or item_quantities.get(item.id)
        if proposed_qty is not None:
            proposed_qty = int(proposed_qty)
            if proposed_qty < 1:
                raise ValidationError({"items": "Số lượng đề xuất phải >= 1."})
            item.proposed_quantity = proposed_qty
            has_qty_change = True
        else:
            item.proposed_quantity = item.requested_quantity
        item.confirmed_quantity = None
        item.save(update_fields=["proposed_quantity", "confirmed_quantity"])

    delivery_changed = False
    if proposed_delivery_time is not None:
        validate_delivery_datetime(proposed_delivery_time)
        preorder.proposed_delivery_time = proposed_delivery_time
        delivery_changed = True
    else:
        preorder.proposed_delivery_time = preorder.requested_delivery_time

    if not has_qty_change and not delivery_changed:
        raise ValidationError(
            {"detail": "Cần đề xuất số lượng hoặc ngày giao khác."}
        )

    preorder.confirmed_delivery_time = None
    preorder.dealer_note = note or ""
    preorder.status = PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING
    preorder.save(
        update_fields=[
            "proposed_delivery_time",
            "confirmed_delivery_time",
            "dealer_note",
            "status",
            "updated_at",
        ]
    )

    from .preorder_notifications import notify_preorder_dealer_proposed

    notify_preorder_dealer_proposed(preorder, actor=user)
    return preorder


@transaction.atomic
def dealer_reject_preorder(preorder, user, *, reason=""):
    if preorder.status != PreOrderRequestStatus.SUBMITTED:
        raise ValidationError({"detail": "Chỉ từ chối YC đang chờ đại lý."})
    reason = (reason or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do từ chối."})

    preorder.status = PreOrderRequestStatus.REJECTED_BY_DEALER
    preorder.reject_reason = reason
    preorder.save(update_fields=["status", "reject_reason", "updated_at"])

    from .preorder_notifications import notify_preorder_dealer_rejected

    notify_preorder_dealer_rejected(preorder, actor=user)
    return preorder


def _effective_preorder_terms(preorder):
    """SL và ngày giao sau khi dealer xử lý."""
    delivery_time = (
        preorder.confirmed_delivery_time
        or preorder.proposed_delivery_time
        or preorder.requested_delivery_time
    )
    items_terms = []
    for item in preorder.items.select_related("dealer_product"):
        qty = (
            item.confirmed_quantity
            or item.proposed_quantity
            or item.requested_quantity
        )
        items_terms.append({"item": item, "quantity": int(qty)})
    return delivery_time, items_terms


@transaction.atomic
def customer_accept_preorder(preorder, user):
    """Customer đồng ý → tạo Order waiting_stock + COD pending."""
    if preorder.status != PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING:
        raise ValidationError({"detail": "YC không ở trạng thái chờ khách xác nhận."})
    if preorder.converted_order_id:
        raise ValidationError({"detail": "YC đã được chuyển thành đơn."})

    delivery_time, items_terms = _effective_preorder_terms(preorder)
    shipping_fee = Decimal(get_system_settings().shipping_fee)
    subtotal = Decimal("0")

    order = Order.objects.create(
        order_code=generate_order_code(preorder.dealer_id),
        customer=preorder.customer,
        dealer=preorder.dealer,
        customer_address=preorder.customer_address,
        status=OrderStatus.WAITING_STOCK,
        receiver_name=preorder.receiver_name,
        receiver_phone=preorder.receiver_phone,
        delivery_address=preorder.delivery_address,
        delivery_time=delivery_time,
        note=preorder.note,
        shipping_fee=shipping_fee,
    )

    for row in items_terms:
        item = row["item"]
        qty = row["quantity"]
        product = item.dealer_product
        unit_price = product.retail_price
        line_subtotal = unit_price * qty
        OrderItem.objects.create(
            order=order,
            dealer_product=product,
            batch=None,
            product_title=item.product_title,
            unit=item.unit,
            quantity=qty,
            unit_price=unit_price,
            import_price=None,
            subtotal=line_subtotal,
        )
        subtotal += line_subtotal

    total_amount = subtotal + shipping_fee
    order.subtotal_amount = subtotal
    order.discount_amount = Decimal("0")
    order.total_amount = total_amount
    order.paid_amount = Decimal("0")
    order.debt_amount = total_amount
    order.save(
        update_fields=[
            "subtotal_amount",
            "discount_amount",
            "total_amount",
            "paid_amount",
            "debt_amount",
            "updated_at",
        ]
    )
    _create_cod_payment(order)

    OrderStatusHistory.objects.create(
        order=order,
        old_status="",
        new_status=OrderStatus.WAITING_STOCK,
        note="Chuyển từ YC đặt trước — chờ hàng về kho",
        changed_by=user,
    )

    now = timezone.now()
    preorder.status = PreOrderRequestStatus.CONVERTED
    preorder.converted_order = order
    preorder.converted_at = now
    preorder.confirmed_delivery_time = delivery_time
    preorder.save(
        update_fields=[
            "status",
            "converted_order",
            "converted_at",
            "confirmed_delivery_time",
            "updated_at",
        ]
    )

    from .preorder_notifications import notify_preorder_converted_to_order

    notify_preorder_converted_to_order(preorder, order, actor=user)
    return order


@transaction.atomic
def customer_reject_preorder(preorder, user, *, reason=""):
    if preorder.status != PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING:
        raise ValidationError({"detail": "YC không ở trạng thái chờ khách xác nhận."})

    preorder.status = PreOrderRequestStatus.REJECTED_BY_CUSTOMER
    preorder.reject_reason = (reason or "Khách hàng từ chối đề xuất.").strip()
    preorder.save(update_fields=["status", "reject_reason", "updated_at"])

    from .preorder_notifications import notify_preorder_customer_rejected

    notify_preorder_customer_rejected(preorder, actor=user)
    return preorder

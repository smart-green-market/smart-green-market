"""Logic nghiệp vụ đơn hàng buyer trên gian hàng đại lý (B2C).

Luồng trạng thái:
  pending → confirmed → processing → shipping → completed
  (buyer xác nhận nhận hàng từ shipping → completed, set delivered_at)

- Tạo đơn: trừ tồn kho ngay (SALE), thanh toán COD.
- Hủy đơn trước giao: hoàn tồn (CANCEL_RESTORE).
- Duyệt trả hàng sau completed: hoàn tồn (RETURN_RESTORE).
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.dealer_products.inventory_expiry import mark_expired_inventory_batches
from apps.dealer_products.inventory_queries import get_sellable_batches_qs
from apps.dealer_products.age_discount import price_for_order_allocation
from apps.customers.models import CustomerAddress
from apps.customers.services import update_favorite_category_from_order
from apps.marketing.services import track_purchase_interactions_for_order
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfileStatus
from apps.system_config.services import get_system_settings
from apps.voucher.services import CartVoucherService

from .models import (
    CustomerPayment,
    CustomerPaymentMethod,
    CustomerPaymentStatus,
    CustomerPaymentType,
    Order,
    OrderItem,
    OrderReturn,
    OrderReturnItem,
    OrderReturnStatus,
    OrderStatus,
    OrderStatusHistory,
)

TERMINAL_STATUSES = {
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURNED,
}

CUSTOMER_ORDER_PENDING_STATUSES = (OrderStatus.PENDING,)
BUYER_CANCELLABLE = {
    OrderStatus.PENDING,
    OrderStatus.DELIVERY_RESCHEDULE_PROPOSED,
}
DEALER_CANCELLABLE = {
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.WAITING_STOCK,
    OrderStatus.DELIVERY_RESCHEDULE_PROPOSED,
}


def generate_order_code(dealer_id: int) -> str:
    """Sinh mã đơn buyer: DH-YYYYMMDD-{dealer_id}-{seq}."""
    today = timezone.now().strftime("%Y%m%d")
    prefix = f"DH-{today}-{dealer_id:04d}"
    seq = Order.objects.filter(order_code__startswith=prefix).count() + 1
    return f"{prefix}-{seq:04d}"


def record_status_change(order, new_status, user, note=""):
    """Ghi lịch sử + cập nhật status + gửi notification."""
    old_status = order.status
    if old_status == new_status:
        return order
    OrderStatusHistory.objects.create(
        order=order,
        old_status=old_status,
        new_status=new_status,
        note=note,
        changed_by=user,
    )
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])

    from .notifications import notify_customer_order_status_change

    notify_customer_order_status_change(order, actor=user, old_status=old_status)
    return order


def _ensure_not_terminal(order):
    if order.status in TERMINAL_STATUSES:
        raise ValidationError({"detail": "Đơn hàng đã kết thúc, không thể thay đổi."})


def _active_batches_qs(dealer_product):
    return get_sellable_batches_qs(dealer_product, for_update=True)


def _allocate_batches(dealer_product, quantity):
    """Phân bổ FIFO — trả list (batch, qty)."""
    allocations = []
    remaining = quantity
    for batch in _active_batches_qs(dealer_product):
        if remaining <= 0:
            break
        take = min(batch.remaining_quantity, remaining)
        if take > 0:
            allocations.append((batch, take))
            remaining -= take
    if remaining > 0:
        raise ValidationError(
            {
                "items": (
                    f"Sản phẩm '{dealer_product.title}' không đủ tồn "
                    f"(thiếu {remaining} đơn vị)."
                )
            }
        )
    return allocations


def _deduct_batch(batch, quantity, order_code, user):
    qty_before = batch.remaining_quantity
    batch.remaining_quantity -= quantity
    if batch.remaining_quantity == 0:
        batch.status = DealerInventoryBatchStatus.DEPLETED
    batch.save(update_fields=["remaining_quantity", "status", "updated_at"])
    DealerInventoryTransaction.objects.create(
        batch=batch,
        type=DealerInventoryTransactionType.SALE,
        quantity_before=qty_before,
        quantity_change=-quantity,
        quantity_after=batch.remaining_quantity,
        reason=f"Bán hàng — {order_code}",
        created_by=user,
    )


def _restore_batch_quantity(*, batch, quantity, user, transaction_type, reason):
    """Cộng lại tồn lô; kích hoạt lại batch nếu trước đó đã hết."""
    batch = DealerInventoryBatch.objects.select_for_update().get(pk=batch.pk)
    qty_before = batch.remaining_quantity
    batch.remaining_quantity += quantity
    if batch.status == DealerInventoryBatchStatus.DEPLETED:
        batch.status = DealerInventoryBatchStatus.ACTIVE
    batch.save(update_fields=["remaining_quantity", "status", "updated_at"])
    DealerInventoryTransaction.objects.create(
        batch=batch,
        type=transaction_type,
        quantity_before=qty_before,
        quantity_change=quantity,
        quantity_after=batch.remaining_quantity,
        reason=reason,
        created_by=user,
    )


def _restore_order_inventory(order, user, reason):
    """Hoàn lại tồn kho đã trừ khi đơn bị hủy trước giao hàng."""
    for item in order.items.select_related("batch"):
        if item.batch_id is None:
            continue
        _restore_batch_quantity(
            batch=item.batch,
            quantity=item.quantity,
            user=user,
            transaction_type=DealerInventoryTransactionType.CANCEL_RESTORE,
            reason=f"Hoàn tồn do hủy đơn {order.order_code}: {reason}",
        )


def _restore_return_inventory(order_return, user, reason):
    """Hoàn lại tồn kho khi dealer duyệt trả hàng buyer."""
    order = order_return.order
    for return_item in order_return.items.select_related("order_item__batch"):
        _restore_batch_quantity(
            batch=return_item.order_item.batch,
            quantity=return_item.quantity,
            user=user,
            transaction_type=DealerInventoryTransactionType.RETURN_RESTORE,
            reason=f"Hoàn tồn do trả hàng {order.order_code}: {reason}",
        )


from .delivery_slots import validate_delivery_datetime


def _validate_delivery_time(delivery_time):
    validate_delivery_datetime(delivery_time)


def _resolve_customer_address(customer, customer_address_id):
    try:
        address = CustomerAddress.objects.get(pk=customer_address_id, customer=customer)
    except CustomerAddress.DoesNotExist as exc:
        raise ValidationError(
            {"customer_address_id": "Địa chỉ không tồn tại hoặc không thuộc tài khoản."}
        ) from exc
    return address


def _validate_order_items(dealer, items_data):
    """items_data: list of {dealer_product, quantity}."""
    if not items_data:
        raise ValidationError({"items": "Đơn hàng phải có ít nhất một sản phẩm."})

    product_ids = [row["dealer_product"].id for row in items_data]
    products = DealerProduct.objects.filter(id__in=product_ids).select_related(
        "supplier_product",
        "dealer_profile",
        "category",
    )
    if products.count() != len(set(product_ids)):
        raise ValidationError({"items": "Có sản phẩm không tồn tại."})

    product_map = {p.id: p for p in products}
    validated = []
    for row in items_data:
        product = product_map.get(row["dealer_product"].id)
        if product.dealer_profile_id != dealer.id:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.title}' không thuộc cửa hàng này."}
            )
        if product.status != DealerProductStatus.ACTIVE:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.title}' không còn bán."}
            )
        quantity = int(row["quantity"])
        if quantity < 1:
            raise ValidationError({"items": "Số lượng phải >= 1."})
        validated.append({"dealer_product": product, "quantity": quantity})
    return validated


def _build_order_items(order, validated_items, user, voucher_code=""):
    """Tạo OrderItem + trừ tồn FIFO. Một SP có thể tách nhiều dòng theo lô."""
    subtotal = Decimal("0")
    for row in validated_items:
        product = row["dealer_product"]
        quantity = row["quantity"]
        unit = product.supplier_product.unit if product.supplier_product_id else ""

        allocations = _allocate_batches(product, quantity)
        for batch, batch_qty in allocations:
            unit_price = price_for_order_allocation(batch, batch_qty)
            line_subtotal = unit_price * batch_qty
            import_price = batch.import_price
            OrderItem.objects.create(
                order=order,
                dealer_product=product,
                batch=batch,
                product_title=product.title,
                unit=unit,
                quantity=batch_qty,
                unit_price=unit_price,
                import_price=import_price,
                subtotal=line_subtotal,
            )
            _deduct_batch(batch, batch_qty, order.order_code, user)
            subtotal += line_subtotal

    shipping_fee = Decimal(get_system_settings().shipping_fee)
    discount = Decimal("0")
    order.subtotal_amount = subtotal
    order.discount_amount = discount
    order.save(update_fields=["subtotal_amount", "discount_amount", "updated_at"])

    if voucher_code:
        _, discount = CartVoucherService.apply_voucher_to_order(
            order,
            voucher_code,
            require_saved=True,
        )

    total_amount = subtotal - discount + shipping_fee
    if total_amount <= 0:
        raise ValidationError({"detail": "Tổng tiền đơn hàng không hợp lệ."})

    order.subtotal_amount = subtotal
    order.discount_amount = discount
    order.shipping_fee = shipping_fee
    order.total_amount = total_amount
    order.paid_amount = Decimal("0")
    order.debt_amount = total_amount
    order.save(
        update_fields=[
            "subtotal_amount",
            "discount_amount",
            "shipping_fee",
            "total_amount",
            "paid_amount",
            "debt_amount",
            "updated_at",
        ]
    )
    return order


def _create_cod_payment(order):
    CustomerPayment.objects.create(
        order=order,
        payment_method=CustomerPaymentMethod.CASH,
        payment_type=CustomerPaymentType.COD,
        amount=order.total_amount,
        status=CustomerPaymentStatus.PENDING,
    )


def _update_customer_stats(customer, order):
    customer.total_orders += 1
    customer.total_spent += order.total_amount
    customer.last_order_at = timezone.now()
    customer.save(update_fields=["total_orders", "total_spent", "last_order_at", "updated_at"])


def _mark_cod_paid(order):
    payment = order.payments.filter(payment_type=CustomerPaymentType.COD).order_by("-id").first()
    if payment:
        payment.status = CustomerPaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at"])
    order.paid_amount = order.total_amount
    order.debt_amount = Decimal("0")
    order.save(update_fields=["paid_amount", "debt_amount", "updated_at"])


@transaction.atomic
def create_customer_order(
    *,
    dealer,
    customer,
    customer_address_id,
    delivery_time,
    note,
    items_data,
    user,
    voucher_code="",
):
    """Buyer đặt hàng — status pending, trừ tồn ngay, thanh toán COD."""
    if dealer.status != DealerProfileStatus.ACTIVE:
        raise ValidationError({"detail": "Cửa hàng chưa hoạt động, không thể đặt hàng."})

    mark_expired_inventory_batches(dealer_profile_id=dealer.id)

    _validate_delivery_time(delivery_time)
    address = _resolve_customer_address(customer, customer_address_id)
    validated_items = _validate_order_items(dealer, items_data)

    order = Order.objects.create(
        order_code=generate_order_code(dealer.id),
        customer=customer,
        dealer=dealer,
        customer_address=address,
        status=OrderStatus.PENDING,
        receiver_name=address.receiver_name,
        receiver_phone=address.receiver_phone,
        delivery_address=address.address,
        delivery_time=delivery_time,
        note=note or "",
    )
    _build_order_items(order, validated_items, user, voucher_code=voucher_code)
    _create_cod_payment(order)
    update_favorite_category_from_order(customer, validated_items)
    track_purchase_interactions_for_order(
        customer=customer,
        dealer=dealer,
        validated_items=validated_items,
    )

    OrderStatusHistory.objects.create(
        order=order,
        old_status="",
        new_status=OrderStatus.PENDING,
        note="Khách hàng đặt hàng",
        changed_by=user,
    )
    from .notifications import notify_customer_order_status_change

    notify_customer_order_status_change(order, actor=user, old_status="")
    return order


@transaction.atomic
def dealer_confirm_order(order, user, note=""):
    _ensure_not_terminal(order)
    if order.status != OrderStatus.PENDING:
        raise ValidationError({"detail": "Chỉ xác nhận đơn đang chờ (pending)."})
    return record_status_change(
        order,
        OrderStatus.CONFIRMED,
        user,
        note=note or "Đại lý xác nhận đơn",
    )


@transaction.atomic
def dealer_start_processing(order, user, note=""):
    _ensure_not_terminal(order)
    if order.status != OrderStatus.CONFIRMED:
        raise ValidationError({"detail": "Chỉ chuẩn bị hàng khi đơn đã xác nhận (confirmed)."})
    return record_status_change(
        order,
        OrderStatus.PROCESSING,
        user,
        note=note or "Đang chuẩn bị hàng",
    )


@transaction.atomic
def dealer_start_shipping(order, user, note=""):
    _ensure_not_terminal(order)
    if order.status != OrderStatus.PROCESSING:
        raise ValidationError({"detail": "Chỉ giao hàng khi đang chuẩn bị (processing)."})
    return record_status_change(
        order,
        OrderStatus.SHIPPING,
        user,
        note=note or "Đang giao hàng",
    )


@transaction.atomic
def buyer_confirm_received(order, user, note=""):
    """Buyer xác nhận đã nhận hàng: shipping → completed."""
    _ensure_not_terminal(order)
    if order.status != OrderStatus.SHIPPING:
        raise ValidationError({"detail": "Chỉ xác nhận nhận hàng khi đơn đang giao (shipping)."})

    now = timezone.now()
    order.delivered_at = now
    order.completed_at = now
    order.save(update_fields=["delivered_at", "completed_at", "updated_at"])

    _mark_cod_paid(order)
    _update_customer_stats(order.customer, order)

    return record_status_change(
        order,
        OrderStatus.COMPLETED,
        user,
        note=note or "Khách hàng xác nhận đã nhận hàng",
    )


@transaction.atomic
def cancel_customer_order(order, user, *, reason, actor="dealer"):
    """Hủy đơn buyer trước khi giao; luôn hoàn tồn theo batch đã trừ."""
    _ensure_not_terminal(order)
    reason = (reason or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do hủy."})

    if actor == "buyer":
        allowed = order.status in BUYER_CANCELLABLE
    elif actor == "admin":
        allowed = order.status in DEALER_CANCELLABLE
    else:
        allowed = order.status in DEALER_CANCELLABLE
    if not allowed:
        raise ValidationError({"detail": "Không thể hủy đơn ở trạng thái hiện tại."})

    _restore_order_inventory(order, user, reason)
    now = timezone.now()
    order.cancelled_at = now
    order.cancelled_by = user
    order.cancel_reason = reason
    order.paid_amount = Decimal("0")
    order.debt_amount = Decimal("0")
    order.payments.filter(status=CustomerPaymentStatus.PENDING).update(
        status=CustomerPaymentStatus.CANCELLED,
        note=reason,
    )
    order.save(
        update_fields=[
            "cancelled_at",
            "cancelled_by",
            "cancel_reason",
            "paid_amount",
            "debt_amount",
            "updated_at",
        ]
    )
    return record_status_change(order, OrderStatus.CANCELLED, user, note=reason)


@transaction.atomic
def buyer_request_return(order, user, *, reason, evidence_file=None):
    """Buyer yêu cầu trả toàn bộ đơn sau khi đơn đã hoàn tất (một lần)."""
    _ensure_not_terminal_for_return(order)
    reason = (reason or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do trả hàng."})
    if order.status != OrderStatus.COMPLETED:
        raise ValidationError({"detail": "Chỉ yêu cầu trả hàng sau khi đơn đã hoàn tất."})
    if order.returns.filter(status=OrderReturnStatus.APPROVED).exists():
        raise ValidationError({"detail": "Đơn đã được trả hàng, không thể yêu cầu thêm."})
    if order.returns.filter(status=OrderReturnStatus.REQUESTED).exists():
        raise ValidationError({"detail": "Đã có yêu cầu trả hàng đang chờ xử lý."})

    order_items = list(order.items.all())
    if not order_items:
        raise ValidationError({"detail": "Đơn không có sản phẩm để trả."})

    order_return = OrderReturn.objects.create(
        order=order,
        reason=reason,
        evidence_file=evidence_file,
        requested_by=user,
    )
    refund_amount = Decimal("0")
    for item in order_items:
        OrderReturnItem.objects.create(
            order_return=order_return,
            order_item=item,
            quantity=item.quantity,
            reason="",
        )
        refund_amount += item.subtotal

    order_return.refund_amount = refund_amount.quantize(Decimal("0.01"))
    order_return.save(update_fields=["refund_amount"])
    record_status_change(order, OrderStatus.RETURN_REQUESTED, user, note=reason)
    return order_return


def _ensure_not_terminal_for_return(order):
    if order.status in {OrderStatus.CANCELLED, OrderStatus.RETURNED}:
        raise ValidationError({"detail": "Đơn hàng đã kết thúc, không thể trả hàng."})


@transaction.atomic
def dealer_review_return(order_return, user, *, approved, review_note=""):
    """Dealer duyệt/từ chối yêu cầu trả hàng buyer."""
    order = order_return.order
    _ensure_not_terminal_for_return(order)
    if order.status != OrderStatus.RETURN_REQUESTED:
        raise ValidationError({"detail": "Đơn không ở trạng thái chờ xử lý trả hàng."})
    if order_return.status != OrderReturnStatus.REQUESTED:
        raise ValidationError({"detail": "Yêu cầu trả hàng này đã được xử lý."})

    note = (review_note or "").strip()
    if not approved and not note:
        raise ValidationError({"review_note": "Vui lòng nhập lý do từ chối trả hàng."})

    order_return.reviewed_by = user
    order_return.review_note = note
    order_return.resolved_at = timezone.now()

    if not approved:
        order_return.status = OrderReturnStatus.REJECTED
        order_return.save(
            update_fields=["status", "reviewed_by", "review_note", "resolved_at"]
        )
        record_status_change(
            order,
            OrderStatus.COMPLETED,
            user,
            note=note or "Từ chối yêu cầu trả hàng",
        )
        return order_return

    order_return.status = OrderReturnStatus.APPROVED
    order_return.save(
        update_fields=["status", "reviewed_by", "review_note", "resolved_at"]
    )

    restore_note = note or "Đã duyệt trả toàn bộ đơn"
    _restore_return_inventory(order_return, user, restore_note)

    returned_value = order_return.refund_amount
    order.paid_amount = max(order.paid_amount - returned_value, Decimal("0"))
    order.debt_amount = Decimal("0")
    order.customer.total_spent = max(
        order.customer.total_spent - returned_value,
        Decimal("0"),
    )
    order.customer.save(update_fields=["total_spent", "updated_at"])

    order.payments.filter(status=CustomerPaymentStatus.PAID).update(
        status=CustomerPaymentStatus.REFUNDED,
        note=note or "Hoàn tiền do trả hàng",
    )

    order.save(update_fields=["paid_amount", "debt_amount", "updated_at"])
    record_status_change(
        order,
        OrderStatus.RETURNED,
        user,
        note=restore_note,
    )
    return order_return

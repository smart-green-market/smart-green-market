"""Logic nghiệp vụ phiếu nhập hàng: state machine, thanh toán, nhập kho dealer.

FILE LIÊN QUAN (đọc kèm khi vấn đáp):
- views.py          : API endpoint → gọi hàm trong file này
- serializers.py    : validate input JSON/multipart trước khi vào service
- models.py         : 4 bảng DB + enum trạng thái
- notifications.py  : push thông báo khi status đổi
- common/business_rules.py : min/max tiền đơn, % cọc, ngày giao tối thiểu
- common/vietqr.py  : sinh QR chuyển khoản tới TK NCC
- common/banks.py   : danh sách ngân hàng (dropdown NCC)
- apps/dealer_products/ : nhập kho đại lý khi đơn completed
- common/querysets.py : filter_purchase_orders (phân quyền list)

=== SƠ ĐỒ LUỒNG ===
[Đại lý] POST /purchase-orders/           → create_purchase_orders (tách theo NCC)
[NCC]    POST .../confirm/                → supplier_confirm_order (+ duyệt SP)
[Dealer] POST .../approve-adjustment/     → dealer_approve_adjustment (nếu có điều chỉnh)
[NCC]    POST .../reject/                 → supplier_reject_order
[Đại lý] GET  .../payment-qr?deposit      → get_payment_qr (VietQR)
[Đại lý] POST .../submit-deposit/         → dealer_submit_payment (cọc)
[NCC]    POST .../verify-payment/         → supplier_verify_payment
[NCC]    POST .../ship/                   → supplier_start_shipping
[Đại lý] POST .../confirm-delivery/       → dealer_confirm_delivery
[Đại lý] GET  .../payment-qr?final_payment→ get_payment_qr
[Đại lý] POST .../submit-final-payment/   → dealer_submit_payment (cuối)
[NCC]    POST .../verify-payment/         → supplier_verify_payment → _complete_order → _import_dealer_inventory
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.dealer_products.canonical_inventory import (
    add_import_to_main_batch,
    get_or_create_canonical_dealer_product,
)
from apps.dealer_products.models import DealerProduct
from apps.accounts.models import AccountStatus
from apps.categories.models import CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfileStatus
from apps.marketing.dealer_catalog_services import track_purchase_interactions_for_purchase_orders
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from common.business_rules import (
    validate_confirmed_delivery_time,
    validate_deposit_percent,
    validate_order_amount,
    validate_requested_delivery_time,
)
from apps.system_config.services import get_system_settings
from common.validators import REJECTION_REASON_REQUIRED_MSG
from common.vietqr import build_supplier_payment_qr

from .models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderItemReviewStatus,
    PurchaseOrderPayment,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
    PurchaseOrderReturn,
    PurchaseOrderReturnItem,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
    PurchaseOrderStatusHistory,
)

TERMINAL_STATUSES = {
    PurchaseOrderStatus.REJECTED,
    PurchaseOrderStatus.COMPLETED,
    PurchaseOrderStatus.CANCELLED,
    PurchaseOrderStatus.RETURNED,
}

DEALER_CANCELLABLE = {
    PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
    PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION,
    PurchaseOrderStatus.CONFIRMED,
}

RETURN_REQUESTABLE = {
    PurchaseOrderStatus.DELIVERED,
}


def _quantize_money(value) -> Decimal:
    return Decimal(value or 0).quantize(Decimal("0.01"))


def _recalculate_order_balances(order):
    """Đồng bộ deposit_amount, debt_amount, credit_amount theo total và paid."""
    paid = _quantize_money(order.paid_amount)
    total = _quantize_money(order.total_amount)

    if order.deposit_percent and order.deposit_percent > 0:
        order.deposit_amount = _quantize_money(
            total * order.deposit_percent / Decimal("100")
        )
    else:
        order.deposit_amount = Decimal("0")

    order.debt_amount = _quantize_money(max(total - paid, Decimal("0")))
    order.credit_amount = _quantize_money(max(paid - total, Decimal("0")))


def _apply_return_financial_adjustment(order, refund_amount: Decimal):
    """Giảm tổng đơn sau trả hàng và tính lại các số dư thanh toán."""
    refund_amount = _quantize_money(refund_amount)
    order.total_amount = _quantize_money(
        max(order.total_amount - refund_amount, Decimal("0"))
    )
    _recalculate_order_balances(order)


def _get_returned_quantities_by_item_id(order) -> dict[int, Decimal]:
    """Tổng số lượng đã trả (approved) theo từng dòng phiếu nhập."""
    rows = (
        PurchaseOrderReturnItem.objects.filter(
            purchase_order_return__purchase_order=order,
            purchase_order_return__status=PurchaseOrderReturnStatus.APPROVED,
        )
        .values("purchase_order_item_id")
        .annotate(returned=Sum("quantity"))
    )
    return {row["purchase_order_item_id"]: row["returned"] for row in rows}


def _returnable_quantity(*, order_item, returned_qty: Decimal) -> Decimal:
    if order_item.review_status != PurchaseOrderItemReviewStatus.APPROVED:
        return Decimal("0")
    return order_item.quantity - returned_qty


def _compute_return_line_refund(order_item, return_qty: Decimal) -> Decimal:
    """Hoàn tiền theo đơn giá × số lượng trả."""
    return (order_item.unit_price * return_qty).quantize(Decimal("0.01"))


def _all_items_fully_returned(order) -> bool:
    returned_map = _get_returned_quantities_by_item_id(order)
    approved_items = order.items.filter(
        review_status=PurchaseOrderItemReviewStatus.APPROVED,
    )
    if not approved_items.exists():
        return False
    for item in approved_items:
        returned = returned_map.get(item.id, Decimal("0"))
        if returned < item.quantity:
            return False
    return True


def _remaining_import_quantity(order, order_item) -> int:
    """Số lượng còn nhập kho sau khi trừ các lần trả hàng đã duyệt."""
    returned_map = _get_returned_quantities_by_item_id(order)
    returned = returned_map.get(order_item.id, Decimal("0"))
    return max(int(order_item.quantity - returned), 0)


def generate_order_code(dealer_id: int) -> str:
    """Sinh mã phiếu duy nhất: PN-YYYYMMDD-{dealer_id}-{seq}.

    Ví dụ: PN-20250610-0003-0001 — seq tăng theo số đơn cùng ngày của đại lý đó.
    """
    today = timezone.now().strftime("%Y%m%d")
    prefix = f"PN-{today}-{dealer_id:04d}"
    seq = PurchaseOrder.objects.filter(order_code__startswith=prefix).count() + 1
    return f"{prefix}-{seq:04d}"


def record_status_change(order, new_status, user, note=""):
    """Ghi lịch sử + cập nhật status + gửi notification cho bên còn lại.

    Mọi bước chuyển trạng thái đều đi qua hàm này để audit trail nhất quán.
    """
    old_status = order.status
    if old_status == new_status:
        return order
    PurchaseOrderStatusHistory.objects.create(
        purchase_order=order,
        old_status=old_status,
        new_status=new_status,
        note=note,
        changed_by=user,
    )
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])

    from .notifications import notify_purchase_order_status_change

    notify_purchase_order_status_change(order, actor=user, old_status=old_status)
    return order


def _ensure_not_terminal(order):
    """Chặn thao tác trên đơn đã kết thúc (rejected / completed / cancelled)."""
    if order.status in TERMINAL_STATUSES:
        raise ValidationError({"detail": "Phiếu nhập đã kết thúc, không thể thay đổi."})


def _refresh_payment_totals(order):
    """Tính lại paid_amount và debt_amount từ các payment status=verified."""
    paid = (
        order.payments.filter(status=PurchaseOrderPaymentStatus.VERIFIED).aggregate(
            total=Sum("amount")
        )["total"]
        or Decimal("0")
    )
    order.paid_amount = _quantize_money(paid)
    _recalculate_order_balances(order)
    order.save(
        update_fields=[
            "paid_amount",
            "deposit_amount",
            "debt_amount",
            "credit_amount",
            "updated_at",
        ]
    )


def validate_supplier_for_dealer_order(supplier):
    """Đại lý chỉ đặt hàng từ NCC đã duyệt và tài khoản active."""
    if supplier.verification_status != SupplierVerificationStatus.APPROVED:
        raise ValidationError({"supplier_id": "Nhà cung cấp chưa được duyệt."})
    if supplier.account.status != AccountStatus.ACTIVE:
        raise ValidationError({"supplier_id": "Tài khoản nhà cung cấp chưa active."})


def validate_items_for_supplier(supplier_id, items_data):
    """Kiểm tra từng dòng: thuộc đúng NCC, sản phẩm active, đã có wholesale_price."""
    product_ids = [item["supplier_product"].id for item in items_data]
    products = SupplierProduct.objects.filter(id__in=product_ids)
    if products.count() != len(set(product_ids)):
        raise ValidationError({"items": "Có sản phẩm không tồn tại."})

    for product in products:
        if product.supplier_id != supplier_id:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.name}' không thuộc nhà cung cấp đã chọn."}
            )
        if product.status != SupplierProductStatus.ACTIVE:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.name}' chưa active, không thể đặt."}
            )
        if product.wholesale_price is None:
            raise ValidationError(
                {"items": f"Sản phẩm '{product.name}' chưa có giá sỉ."}
            )


def merge_purchase_order_items(items_data):
    """Gộp các dòng trùng supplier_product_id (cộng quantity)."""
    merged: dict[int, dict] = {}
    for row in items_data:
        product = row["supplier_product"]
        quantity = Decimal(row["quantity"])
        note = (row.get("note") or "").strip()
        if product.id in merged:
            merged[product.id]["quantity"] += quantity
            if note and note not in merged[product.id]["note"]:
                prev = merged[product.id]["note"]
                merged[product.id]["note"] = f"{prev}; {note}" if prev else note
        else:
            merged[product.id] = {
                "supplier_product": product,
                "quantity": quantity,
                "note": note,
            }
    return list(merged.values())


def group_items_by_supplier(items_data):
    """Nhóm dòng đặt hàng theo supplier_id."""
    groups: dict[int, list] = {}
    for row in items_data:
        supplier_id = row["supplier_product"].supplier_id
        groups.setdefault(supplier_id, []).append(row)
    return groups


def _apply_pricing_snapshot(item, pricing, quantity: Decimal):
    """Ghi snapshot giá gốc + ưu đãi theo số lượng lên dòng đơn."""
    quantity = Decimal(quantity)
    item.unit_price = pricing.effective_unit_price
    item.base_unit_price = pricing.base_unit_price
    item.discount_type = pricing.discount_type or ""
    item.discount_value = pricing.discount_value
    item.discount_min_quantity = pricing.min_quantity
    item.line_discount_amount = (
        pricing.discount_amount_per_unit * quantity
    ).quantize(Decimal("0.01"))
    item.subtotal = (quantity * item.unit_price).quantize(Decimal("0.01"))


def build_order_items(order, items_data):
    """Tạo PurchaseOrderItem, snapshot unit_price (có giảm theo số lượng), tính total_amount."""
    from apps.supplier_products.quantity_discount import compute_wholesale_unit_price

    total = Decimal("0")
    created = []
    for row in items_data:
        product = row["supplier_product"]
        quantity = Decimal(row["quantity"])
        pricing = compute_wholesale_unit_price(product, quantity)
        item = PurchaseOrderItem(
            purchase_order=order,
            supplier_product=product,
            quantity=quantity,
            original_quantity=quantity,
            note=row.get("note", ""),
            unit_price=pricing.effective_unit_price,
            base_unit_price=pricing.base_unit_price,
        )
        _apply_pricing_snapshot(item, pricing, quantity)
        item.save()
        subtotal = item.subtotal
        total += subtotal
        created.append(item)
    order.total_amount = total
    order.debt_amount = total
    order.save(update_fields=["total_amount", "debt_amount", "updated_at"])
    return created


@transaction.atomic
def create_purchase_order(*, dealer_profile, supplier, delivery_data, items_data, user):
    """Bước 1 — Đại lý tạo phiếu nhập.

    Điều kiện: đại lý active, SP thuộc NCC & active, ngày giao >= min_delivery_lead_days,
    tổng tiền trong [min_order_amount, max_order_amount].
    Kết quả: status = pending_supplier_confirmation.
    """
    if dealer_profile.status != DealerProfileStatus.ACTIVE:
        raise ValidationError({"detail": "Hồ sơ đại lý chưa active, không thể tạo phiếu nhập."})

    validate_supplier_for_dealer_order(supplier)
    validate_items_for_supplier(supplier.id, items_data)
    validate_requested_delivery_time(delivery_data["requested_delivery_time"])

    order = PurchaseOrder.objects.create(
        order_code=generate_order_code(dealer_profile.id),
        supplier=supplier,
        dealer=dealer_profile,
        status=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
        **delivery_data,
    )
    build_order_items(order, items_data)
    validate_order_amount(order.total_amount)
    PurchaseOrderStatusHistory.objects.create(
        purchase_order=order,
        old_status="",
        new_status=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
        note="Đại lý gửi phiếu nhập",
        changed_by=user,
    )
    from .notifications import notify_purchase_order_status_change

    notify_purchase_order_status_change(order, actor=user, old_status="")
    return order


@transaction.atomic
def create_purchase_orders(
    *,
    dealer_profile,
    delivery_data,
    items_data,
    user,
    forced_supplier_id=None,
):
    """Đại lý gửi một phiếu — backend tách thành nhiều PO theo từng NCC.

    Mỗi NCC = một PurchaseOrder riêng, cùng thông tin giao hàng.
    """
    if not items_data:
        raise ValidationError({"items": "Cần ít nhất một sản phẩm."})

    normalized_items = merge_purchase_order_items(items_data)

    if forced_supplier_id is not None:
        mismatched = [
            row["supplier_product"].name
            for row in normalized_items
            if row["supplier_product"].supplier_id != forced_supplier_id
        ]
        if mismatched:
            raise ValidationError(
                {
                    "items": (
                        "Có sản phẩm không thuộc NCC đã chọn "
                        f"({', '.join(mismatched[:3])}{'...' if len(mismatched) > 3 else ''}). "
                        "Bỏ supplier_id để đặt từ nhiều NCC trong một lần gửi."
                    )
                }
            )
        supplier_groups = {forced_supplier_id: normalized_items}
    else:
        supplier_groups = group_items_by_supplier(normalized_items)

    orders = []
    for supplier_id in sorted(supplier_groups.keys()):
        supplier_items = supplier_groups[supplier_id]
        try:
            supplier = Supplier.objects.select_related("account").get(pk=supplier_id)
        except Supplier.DoesNotExist as exc:
            raise ValidationError({"items": f"Nhà cung cấp id={supplier_id} không tồn tại."}) from exc

        order = create_purchase_order(
            dealer_profile=dealer_profile,
            supplier=supplier,
            delivery_data=delivery_data,
            items_data=supplier_items,
            user=user,
        )
        orders.append(order)

    track_purchase_interactions_for_purchase_orders(
        dealer=dealer_profile,
        items_data=normalized_items,
    )
    return orders


def _normalize_confirm_items(order, items_data):
    """Chuẩn hóa payload duyệt dòng SP — không gửi items thì duyệt hết với SL hiện tại."""
    db_items = list(order.items.order_by("id"))
    if not db_items:
        raise ValidationError({"items": "Phiếu không có sản phẩm."})

    if not items_data:
        return [
            {
                "id": item.id,
                "review_status": PurchaseOrderItemReviewStatus.APPROVED,
                "quantity": item.quantity,
                "rejection_reason": "",
            }
            for item in db_items
        ]

    item_map = {item.id: item for item in db_items}
    payload_ids = {row["id"] for row in items_data}
    if payload_ids != set(item_map):
        raise ValidationError({"items": "Phải gửi đủ tất cả dòng sản phẩm của phiếu."})

    normalized = []
    for row in items_data:
        item_id = row["id"]
        review_status = row["review_status"]
        if review_status not in (
            PurchaseOrderItemReviewStatus.APPROVED,
            PurchaseOrderItemReviewStatus.REJECTED,
        ):
            raise ValidationError(
                {"items": f"Dòng {item_id}: review_status phải là approved hoặc rejected."}
            )

        rejection_reason = (row.get("rejection_reason") or "").strip()
        if review_status == PurchaseOrderItemReviewStatus.REJECTED and not rejection_reason:
            raise ValidationError(
                {f"items[{item_id}].rejection_reason": "Bắt buộc khi từ chối dòng sản phẩm."}
            )

        quantity = row.get("quantity", item_map[item_id].quantity)
        if review_status == PurchaseOrderItemReviewStatus.APPROVED:
            quantity = Decimal(quantity)
            if quantity <= 0:
                raise ValidationError(
                    {f"items[{item_id}].quantity": "Số lượng phải lớn hơn 0."}
                )
        else:
            quantity = item_map[item_id].quantity

        normalized.append(
            {
                "id": item_id,
                "review_status": review_status,
                "quantity": quantity,
                "rejection_reason": rejection_reason,
            }
        )
    return normalized


def _apply_item_reviews(order, items_data):
    """Cập nhật trạng thái duyệt từng dòng; trả (approved_total, has_item_changes)."""
    from apps.supplier_products.quantity_discount import compute_wholesale_unit_price

    item_map = {item.id: item for item in order.items.select_for_update().order_by("id")}
    approved_total = Decimal("0")
    has_item_changes = False
    approved_count = 0

    for row in items_data:
        item = item_map[row["id"]]
        original_qty = item.original_quantity
        review_status = row["review_status"]

        if review_status == PurchaseOrderItemReviewStatus.REJECTED:
            item.review_status = PurchaseOrderItemReviewStatus.REJECTED
            item.rejection_reason = row["rejection_reason"]
            item.quantity = Decimal("0")
            item.subtotal = Decimal("0")
            item.line_discount_amount = Decimal("0")
            has_item_changes = True
        else:
            new_qty = Decimal(row["quantity"])
            item.review_status = PurchaseOrderItemReviewStatus.APPROVED
            item.rejection_reason = ""
            item.quantity = new_qty
            pricing = compute_wholesale_unit_price(item.supplier_product, new_qty)
            _apply_pricing_snapshot(item, pricing, new_qty)
            approved_total += item.subtotal
            approved_count += 1
            if new_qty != original_qty:
                has_item_changes = True

        item.save(
            update_fields=[
                "review_status",
                "rejection_reason",
                "quantity",
                "unit_price",
                "base_unit_price",
                "discount_type",
                "discount_value",
                "discount_min_quantity",
                "line_discount_amount",
                "subtotal",
            ]
        )

    if approved_count == 0:
        raise ValidationError(
            {"items": "Cần ít nhất một sản phẩm được duyệt. Dùng reject cả phiếu nếu không nhận đơn."}
        )

    return approved_total, has_item_changes


def _delivery_time_changed(order, confirmed_delivery_time):
    return confirmed_delivery_time != order.requested_delivery_time


@transaction.atomic
def supplier_confirm_order(
    order,
    user,
    deposit_percent=None,
    note="",
    confirmed_delivery_time=None,
    items_data=None,
):
    """Bước 2 — NCC xác nhận đơn, chốt % cọc, ngày giao và duyệt từng dòng SP.

    Không đổi ngày giao / SP → confirmed (flow cũ).
    Có đổi → pending_dealer_confirmation, chờ dealer approve-adjustment hoặc cancel.
    """
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION:
        raise ValidationError({"detail": "Chỉ xác nhận phiếu đang chờ NCC."})

    validate_confirmed_delivery_time(order, confirmed_delivery_time)

    normalized_items = _normalize_confirm_items(order, items_data)
    approved_total, has_item_changes = _apply_item_reviews(order, normalized_items)
    validate_order_amount(approved_total)

    raw_percent = (
        deposit_percent
        if deposit_percent is not None
        else get_system_settings().default_deposit_percent
    )
    percent = validate_deposit_percent(raw_percent)

    order.total_amount = approved_total
    order.deposit_percent = percent
    order.deposit_amount = (approved_total * percent / Decimal("100")).quantize(
        Decimal("0.01")
    )
    _recalculate_order_balances(order)
    order.confirmed_delivery_time = confirmed_delivery_time
    order.confirmed_at = timezone.now()
    order.save(
        update_fields=[
            "total_amount",
            "debt_amount",
            "credit_amount",
            "deposit_percent",
            "deposit_amount",
            "confirmed_delivery_time",
            "confirmed_at",
            "updated_at",
        ]
    )

    req_label = timezone.localtime(order.requested_delivery_time).strftime(
        "%d/%m/%Y %H:%M"
    )
    conf_label = timezone.localtime(confirmed_delivery_time).strftime(
        "%d/%m/%Y %H:%M"
    )
    history_note = (
        f"Xác nhận. Giao cam kết: {conf_label} (dealer mong: {req_label})."
    )
    if note:
        history_note = f"{history_note} {note}"

    delivery_changed = _delivery_time_changed(order, confirmed_delivery_time)
    needs_dealer_approval = delivery_changed or has_item_changes

    if needs_dealer_approval:
        record_status_change(
            order,
            PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION,
            user,
            note=history_note,
        )
        from .notifications import notify_adjustment_pending_dealer

        notify_adjustment_pending_dealer(
            order,
            actor=user,
            delivery_changed=delivery_changed,
            items_changed=has_item_changes,
        )
    else:
        record_status_change(order, PurchaseOrderStatus.CONFIRMED, user, note=history_note)

    return order


@transaction.atomic
def dealer_approve_adjustment(order, user, note=""):
    """Dealer chấp nhận điều chỉnh ngày giao / sản phẩm từ NCC → confirmed."""
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION:
        raise ValidationError(
            {"detail": "Chỉ xác nhận điều chỉnh khi phiếu đang chờ đại lý duyệt."}
        )
    if order.dealer.account_id != user.id:
        raise ValidationError({"detail": "Không có quyền."})

    history_note = note.strip() or "Đại lý đồng ý điều chỉnh của NCC."
    record_status_change(order, PurchaseOrderStatus.CONFIRMED, user, note=history_note)
    return order


@transaction.atomic
def supplier_reject_order(order, user, rejection_reason):
    """Bước 2b — NCC từ chối đơn (chỉ khi pending_supplier_confirmation).

    Bắt buộc rejection_reason → status = rejected (terminal).
    """
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION:
        raise ValidationError({"detail": "Chỉ từ chối phiếu đang chờ NCC."})
    if not rejection_reason.strip():
        raise ValidationError({"rejection_reason": "Vui lòng nhập lý do từ chối."})

    order.rejection_reason = rejection_reason
    order.save(update_fields=["rejection_reason", "updated_at"])
    record_status_change(order, PurchaseOrderStatus.REJECTED, user, note=rejection_reason)
    return order


@transaction.atomic
def dealer_submit_payment(order, user, payment_type, payment_data):
    """Bước 3/7 — Đại lý nộp biên lai thanh toán (multipart: receipt_file).

  - DEPOSIT: khi confirmed → tạo payment pending, status đơn = deposit_pending_verification
  - FINAL_PAYMENT: khi delivered → amount = debt_amount còn lại
    """
    _ensure_not_terminal(order)

    if payment_type == PurchaseOrderPaymentType.DEPOSIT:
        if order.status != PurchaseOrderStatus.CONFIRMED:
            raise ValidationError({"detail": "Chỉ nộp cọc khi phiếu đã được NCC xác nhận."})
        if order.payments.filter(
            payment_type=PurchaseOrderPaymentType.DEPOSIT,
            status=PurchaseOrderPaymentStatus.PENDING,
        ).exists():
            raise ValidationError({"detail": "Đã có thanh toán cọc đang chờ xác nhận."})
        amount = order.deposit_amount
        next_status = PurchaseOrderStatus.DEPOSIT_PENDING_VERIFICATION
    elif payment_type == PurchaseOrderPaymentType.FINAL_PAYMENT:
        if order.status != PurchaseOrderStatus.DELIVERED:
            raise ValidationError({"detail": "Chỉ thanh toán cuối sau khi đã nhận hàng."})
        if order.payments.filter(
            payment_type=PurchaseOrderPaymentType.FINAL_PAYMENT,
            status=PurchaseOrderPaymentStatus.PENDING,
        ).exists():
            raise ValidationError({"detail": "Đã có thanh toán cuối đang chờ xác nhận."})
        amount = order.debt_amount
        if amount <= 0:
            raise ValidationError({"detail": "Không còn số tiền cần thanh toán."})
        next_status = PurchaseOrderStatus.FINAL_PAYMENT_PENDING_VERIFICATION
    else:
        raise ValidationError({"payment_type": "Loại thanh toán không hợp lệ."})

    create_data = dict(payment_data)
    create_data["paid_at"] = create_data.get("paid_at") or timezone.now()
    payment = PurchaseOrderPayment.objects.create(
        purchase_order=order,
        payment_type=payment_type,
        amount=amount,
        status=PurchaseOrderPaymentStatus.PENDING,
        **create_data,
    )
    record_status_change(order, next_status, user, note=f"Gửi {payment_type}")
    return payment


@transaction.atomic
def supplier_verify_payment(payment, user, approved, rejection_reason=""):
    """Bước 4/8 — NCC xác minh hoặc từ chối thanh toán.

    Duyệt cọc  → processing (NCC chuẩn bị/thu hoạch).
    Từ chối cọc → quay lại confirmed (đại lý nộp lại).
    Duyệt cuối  → _complete_order (nhập kho dealer).
    Từ chối cuối → quay lại delivered.
    """
    order = payment.purchase_order
    _ensure_not_terminal(order)

    if payment.status != PurchaseOrderPaymentStatus.PENDING:
        raise ValidationError({"detail": "Thanh toán này đã được xử lý."})

    if not approved:
        if not (rejection_reason or "").strip():
            raise ValidationError({"rejection_reason": REJECTION_REASON_REQUIRED_MSG})
        payment.status = PurchaseOrderPaymentStatus.REJECTED
        payment.rejection_reason = rejection_reason.strip()
        payment.verified_by = user
        payment.verified_at = timezone.now()
        payment.save()

        if payment.payment_type == PurchaseOrderPaymentType.DEPOSIT:
            record_status_change(
                order,
                PurchaseOrderStatus.CONFIRMED,
                user,
                note=rejection_reason or "Từ chối thanh toán cọc",
            )
        else:
            record_status_change(
                order,
                PurchaseOrderStatus.DELIVERED,
                user,
                note=rejection_reason or "Từ chối thanh toán cuối",
            )
        return payment

    payment.status = PurchaseOrderPaymentStatus.VERIFIED
    payment.verified_by = user
    payment.verified_at = timezone.now()
    payment.save()
    _refresh_payment_totals(order)

    if payment.payment_type == PurchaseOrderPaymentType.DEPOSIT:
        record_status_change(
            order,
            PurchaseOrderStatus.PROCESSING,
            user,
            note="Đã xác nhận tiền cọc",
        )
    else:
        _complete_order(order, user)

    return payment


@transaction.atomic
def supplier_start_shipping(order, user, note=""):
    """Bước 5 — NCC bắt đầu giao hàng: processing → shipping."""
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.PROCESSING:
        raise ValidationError({"detail": "Chỉ giao hàng khi đang chuẩn bị (processing)."})
    record_status_change(order, PurchaseOrderStatus.SHIPPING, user, note=note or "Đang giao hàng")
    return order


@transaction.atomic
def dealer_confirm_delivery(order, user, note=""):
    """Bước 6 — Đại lý xác nhận đã nhận hàng: shipping → delivered.

    Sau bước này đại lý có thể thanh toán phần còn lại (final_payment).
    """
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.SHIPPING:
        raise ValidationError({"detail": "Chỉ xác nhận nhận hàng khi đang giao (shipping)."})
    order.delivered_at = timezone.now()
    order.save(update_fields=["delivered_at", "updated_at"])
    record_status_change(order, PurchaseOrderStatus.DELIVERED, user, note=note or "Đã nhận hàng")
    return order


@transaction.atomic
def cancel_order(order, user, note="", *, is_admin=False):
    """Hủy đơn — bắt buộc lý do; dealer chỉ hủy được khi pending hoặc confirmed."""
    _ensure_not_terminal(order)
    reason = (note or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do hủy."})
    if is_admin:
        allowed = order.status not in TERMINAL_STATUSES
    else:
        allowed = order.status in DEALER_CANCELLABLE
    if not allowed:
        raise ValidationError({"detail": "Không thể hủy phiếu ở trạng thái hiện tại."})

    now = timezone.now()
    order.cancelled_at = now
    order.cancelled_by = user
    order.cancel_reason = reason
    order.payments.filter(status=PurchaseOrderPaymentStatus.PENDING).update(
        status=PurchaseOrderPaymentStatus.CANCELLED,
        verified_by=user,
        verified_at=now,
        rejection_reason=reason,
    )
    order.save(
        update_fields=[
            "cancelled_at",
            "cancelled_by",
            "cancel_reason",
            "updated_at",
        ]
    )
    record_status_change(order, PurchaseOrderStatus.CANCELLED, user, note=reason)
    return order


@transaction.atomic
def dealer_request_return(order, user, *, reason, items, evidence_file=None):
    """Đại lý yêu cầu trả một phần hoặc toàn bộ dòng hàng sau khi nhận hàng."""
    _ensure_not_terminal(order)
    reason = (reason or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do trả hàng."})
    if not items:
        raise ValidationError({"items": "Phải chọn ít nhất một dòng hàng để trả."})
    if order.status not in RETURN_REQUESTABLE:
        raise ValidationError({"detail": "Chỉ yêu cầu trả hàng sau khi đã nhận hàng."})
    if order.returns.filter(status=PurchaseOrderReturnStatus.REQUESTED).exists():
        raise ValidationError({"detail": "Đã có yêu cầu trả hàng đang chờ xử lý."})
    if _all_items_fully_returned(order):
        raise ValidationError({"detail": "Tất cả sản phẩm trong phiếu đã được trả hết."})

    order_items_map = {
        item.id: item
        for item in order.items.select_related("supplier_product").all()
    }
    if not order_items_map:
        raise ValidationError({"detail": "Phiếu không có sản phẩm để trả."})

    returned_map = _get_returned_quantities_by_item_id(order)
    seen_item_ids: set[int] = set()
    refund_amount = Decimal("0")

    po_return = PurchaseOrderReturn.objects.create(
        purchase_order=order,
        reason=reason,
        evidence_file=evidence_file,
        requested_by=user,
    )

    for row in items:
        item_id = row["purchase_order_item_id"]
        return_qty = row["quantity"]
        line_reason = (row.get("reason") or "").strip()

        if item_id in seen_item_ids:
            raise ValidationError(
                {"items": f"Trùng purchase_order_item_id={item_id} trong một yêu cầu."}
            )
        seen_item_ids.add(item_id)

        order_item = order_items_map.get(item_id)
        if order_item is None:
            raise ValidationError(
                {"items": f"Dòng hàng {item_id} không thuộc phiếu này."}
            )
        if order_item.review_status != PurchaseOrderItemReviewStatus.APPROVED:
            raise ValidationError(
                {"items": f"Dòng hàng {item_id} chưa được NCC duyệt, không thể trả."}
            )

        already_returned = returned_map.get(item_id, Decimal("0"))
        returnable = _returnable_quantity(
            order_item=order_item,
            returned_qty=already_returned,
        )
        if return_qty > returnable:
            raise ValidationError(
                {
                    "items": (
                        f"Số lượng trả ({return_qty}) vượt quá còn lại "
                        f"({returnable}) cho dòng {item_id}."
                    )
                }
            )

        line_refund = _compute_return_line_refund(order_item, return_qty)
        PurchaseOrderReturnItem.objects.create(
            purchase_order_return=po_return,
            purchase_order_item=order_item,
            quantity=return_qty,
            reason=line_reason,
        )
        refund_amount += line_refund

    po_return.refund_amount = refund_amount.quantize(Decimal("0.01"))
    po_return.save(update_fields=["refund_amount"])
    record_status_change(order, PurchaseOrderStatus.RETURN_REQUESTED, user, note=reason)
    return po_return


@transaction.atomic
def supplier_review_return(po_return, user, *, approved, review_note=""):
    """NCC duyệt/từ chối yêu cầu trả hàng PO."""
    order = po_return.purchase_order
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.RETURN_REQUESTED:
        raise ValidationError({"detail": "Phiếu không ở trạng thái chờ xử lý trả hàng."})
    if po_return.status != PurchaseOrderReturnStatus.REQUESTED:
        raise ValidationError({"detail": "Yêu cầu trả hàng này đã được xử lý."})

    note = (review_note or "").strip()
    if not approved and not note:
        raise ValidationError({"review_note": "Vui lòng nhập lý do từ chối trả hàng."})

    po_return.reviewed_by = user
    po_return.review_note = note
    po_return.resolved_at = timezone.now()

    if not approved:
        po_return.status = PurchaseOrderReturnStatus.REJECTED
        po_return.save(
            update_fields=["status", "reviewed_by", "review_note", "resolved_at"]
        )
        record_status_change(
            order,
            PurchaseOrderStatus.DELIVERED,
            user,
            note=note or "Từ chối yêu cầu trả hàng",
        )
        return po_return

    po_return.status = PurchaseOrderReturnStatus.APPROVED
    po_return.save(
        update_fields=["status", "reviewed_by", "review_note", "resolved_at"]
    )

    returned_value = po_return.refund_amount
    _apply_return_financial_adjustment(order, returned_value)
    order.save(
        update_fields=[
            "total_amount",
            "deposit_amount",
            "debt_amount",
            "credit_amount",
            "updated_at",
        ]
    )

    if _all_items_fully_returned(order):
        next_status = PurchaseOrderStatus.RETURNED
        default_note = "Đã duyệt trả toàn bộ phiếu nhập"
    else:
        next_status = PurchaseOrderStatus.DELIVERED
        default_note = "Đã duyệt trả một phần — phiếu tiếp tục xử lý phần còn lại"

    record_status_change(order, next_status, user, note=note or default_note)
    return po_return


def _complete_order(order, user):
    """Kết thúc đơn sau khi NCC xác minh thanh toán cuối → gọi nhập kho đại lý."""
    order.completed_at = timezone.now()
    order.save(update_fields=["completed_at", "updated_at"])
    record_status_change(order, PurchaseOrderStatus.COMPLETED, user, note="Hoàn tất phiếu nhập")
    _import_dealer_inventory(order, user)


def _resolve_dealer_category(supplier_product):
    """Chọn danh mục cho sản phẩm đại lý khi nhập kho.

    - SP của NCC gắn danh mục HỆ THỐNG (active) → đại lý dùng lại được.
    - SP gắn danh mục RIÊNG của NCC → đại lý không sở hữu → để trống,
      đại lý tự gán danh mục hệ thống / danh mục riêng của mình sau.
    """
    category = supplier_product.category
    if category is None:
        return None
    if (
        category.scope == CategoryScope.SYSTEM
        and category.status == CategoryStatus.ACTIVE
    ):
        return category
    return None


def _import_dealer_inventory(order, user):
    """Nhập kho đại lý: một SP / tên + cộng dồn lô MAIN.

    Danh mục bán lẻ: copy danh mục hệ thống của NCC nếu có (xem _resolve_dealer_category).
    """
    import_date = timezone.now().date()

    for item in order.items.filter(
        review_status=PurchaseOrderItemReviewStatus.APPROVED,
    ).select_related("supplier_product", "supplier_product__category"):
        dealer_product, _ = get_or_create_canonical_dealer_product(
            order.dealer,
            supplier_product=item.supplier_product,
            retail_price=item.unit_price,
            category=_resolve_dealer_category(item.supplier_product),
        )
        qty = _remaining_import_quantity(order, item)
        if qty <= 0:
            continue
        add_import_to_main_batch(
            dealer_product=dealer_product,
            quantity=qty,
            import_price=item.unit_price,
            reason=f"Nhập từ phiếu {order.order_code}",
            user=user,
            import_date=import_date,
        )
        from apps.orders.waiting_stock_services import try_allocate_waiting_orders

        try_allocate_waiting_orders(dealer_product_id=dealer_product.id, user=user)


def get_payment_qr(order, payment_type: str):
    """Sinh payload VietQR (ảnh QR + thông tin TK NCC) cho đại lý quét chuyển khoản.

    - deposit: khi confirmed, amount = deposit_amount
    - final_payment: khi delivered, amount = debt_amount
    TK lấy từ supplier.bank_bin, account_number, account_name.
    """
    supplier = order.supplier
    transfer_content = order.order_code

    if payment_type == PurchaseOrderPaymentType.DEPOSIT:
        if order.status != PurchaseOrderStatus.CONFIRMED:
            raise ValidationError(
                {"detail": "QR cọc chỉ khả dụng khi phiếu ở trạng thái confirmed."}
            )
        amount = order.deposit_amount
        if amount <= 0:
            raise ValidationError({"detail": "Số tiền cọc chưa được tính."})
    elif payment_type == PurchaseOrderPaymentType.FINAL_PAYMENT:
        if order.status != PurchaseOrderStatus.DELIVERED:
            raise ValidationError(
                {"detail": "QR thanh toán cuối chỉ khả dụng khi phiếu ở trạng thái delivered."}
            )
        amount = order.debt_amount
        if amount <= 0:
            raise ValidationError({"detail": "Không còn số tiền cần thanh toán."})
    else:
        raise ValidationError({"payment_type": "Giá trị: deposit hoặc final_payment."})

    qr_data = build_supplier_payment_qr(
        supplier,
        amount=amount,
        transfer_content=transfer_content,
    )
    qr_data["payment_type"] = payment_type
    qr_data["order_id"] = order.id
    qr_data["order_code"] = order.order_code
    return qr_data

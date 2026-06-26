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
[NCC]    POST .../confirm/                → supplier_confirm_order (+ tính cọc)
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

from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerProduct,
    DealerProductStatus,
)
from apps.accounts.models import AccountStatus
from apps.categories.models import CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfileStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from common.business_rules import (
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
    PurchaseOrderPayment,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
    PurchaseOrderStatus,
    PurchaseOrderStatusHistory,
)

TERMINAL_STATUSES = {
    PurchaseOrderStatus.REJECTED,
    PurchaseOrderStatus.COMPLETED,
    PurchaseOrderStatus.CANCELLED,
}

DEALER_CANCELLABLE = {
    PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
    PurchaseOrderStatus.CONFIRMED,
}


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
    order.paid_amount = paid
    order.debt_amount = max(order.total_amount - paid, Decimal("0"))
    order.save(update_fields=["paid_amount", "debt_amount", "updated_at"])


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


def build_order_items(order, items_data):
    """Tạo PurchaseOrderItem, snapshot unit_price từ wholesale_price, tính total_amount."""
    total = Decimal("0")
    created = []
    for row in items_data:
        product = row["supplier_product"]
        quantity = Decimal(row["quantity"])
        unit_price = product.wholesale_price
        subtotal = quantity * unit_price
        item = PurchaseOrderItem.objects.create(
            purchase_order=order,
            supplier_product=product,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
            note=row.get("note", ""),
        )
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
    return orders


@transaction.atomic
def supplier_confirm_order(order, user, deposit_percent=None, note=""):
    """Bước 2 — NCC xác nhận đơn và chốt % cọc.

    deposit_percent mặc định DEFAULT_DEPOSIT_PERCENT (30%), phải trong [10%, 50%].
    Tính deposit_amount = total × % / 100 → status = confirmed.
    """
    _ensure_not_terminal(order)
    if order.status != PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION:
        raise ValidationError({"detail": "Chỉ xác nhận phiếu đang chờ NCC."})

    raw_percent = (
        deposit_percent
        if deposit_percent is not None
        else get_system_settings().default_deposit_percent
    )
    percent = validate_deposit_percent(raw_percent)

    order.deposit_percent = percent
    order.deposit_amount = (order.total_amount * percent / Decimal("100")).quantize(
        Decimal("0.01")
    )
    order.confirmed_at = timezone.now()
    order.save(
        update_fields=[
            "deposit_percent",
            "deposit_amount",
            "confirmed_at",
            "updated_at",
        ]
    )
    record_status_change(order, PurchaseOrderStatus.CONFIRMED, user, note=note)
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
    """Hủy đơn — dealer chỉ hủy được khi pending hoặc confirmed; admin hủy mọi trạng thái chưa terminal."""
    _ensure_not_terminal(order)
    if is_admin:
        allowed = order.status not in TERMINAL_STATUSES
    else:
        allowed = order.status in DEALER_CANCELLABLE
    if not allowed:
        raise ValidationError({"detail": "Không thể hủy phiếu ở trạng thái hiện tại."})
    record_status_change(order, PurchaseOrderStatus.CANCELLED, user, note=note or "Đã hủy phiếu")
    return order


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
    """Tạo DealerProduct (nếu chưa có) + DealerInventoryBatch + transaction IMPORT.

    Mỗi dòng đơn → 1 batch gắn purchase_order_item (FIFO xuất kho sau này).
    Danh mục bán lẻ: copy danh mục hệ thống của NCC nếu có, ngược lại để trống
    cho đại lý tự phân loại (xem _resolve_dealer_category).
  Model: apps/dealer_products/models.py
    """
    import_date = timezone.now().date()
    for item in order.items.select_related("supplier_product", "supplier_product__category"):
        dealer_product, _ = DealerProduct.objects.get_or_create(
            dealer_profile=order.dealer,
            supplier_product=item.supplier_product,
            defaults={
                "title": item.supplier_product.name,
                "retail_price": item.unit_price,
                "category": _resolve_dealer_category(item.supplier_product),
                "status": DealerProductStatus.ACTIVE,
            },
        )
        qty = int(item.quantity)
        if qty <= 0:
            continue
        batch_number = f"{order.order_code}-{item.id}"
        batch = DealerInventoryBatch.objects.create(
            dealer_product=dealer_product,
            purchase_order_item=item,
            batch_number=batch_number,
            quantity=qty,
            remaining_quantity=qty,
            import_price=item.unit_price,
            import_date=import_date,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        DealerInventoryTransaction.objects.create(
            batch=batch,
            type=DealerInventoryTransactionType.IMPORT,
            quantity_before=0,
            quantity_change=qty,
            quantity_after=qty,
            reason=f"Nhập từ phiếu {order.order_code}",
            created_by=user,
        )


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

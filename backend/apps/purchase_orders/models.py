"""Phiếu nhập hàng đại lý từ nhà cung cấp (thu hoạch theo đơn, không kho supplier).

=== CÁC BẢNG LIÊN QUAN ===
- PurchaseOrder        : phiếu nhập (header đơn)
- PurchaseOrderItem    : dòng sản phẩm (snapshot giá sỉ)
- PurchaseOrderPayment : lần thanh toán cọc / cuối + biên lai
- PurchaseOrderStatusHistory : audit log chuyển trạng thái

=== LUỒNG TRẠNG THÁI (xem services.py) ===
pending_supplier_confirmation → confirmed → deposit_pending_verification → ...
NCC đổi ngày giao / SP → pending_dealer_confirmation → (dealer approve) → confirmed
Nhánh từ chối: rejected | hủy: cancelled
"""

from decimal import Decimal

from django.conf import settings
from django.db import models


class PurchaseOrderStatus(models.TextChoices):
    """Trạng thái phiếu nhập hàng."""

    PENDING_SUPPLIER_CONFIRMATION = (
        "pending_supplier_confirmation",
        "Chờ NCC xác nhận",
    )
    REJECTED = "rejected", "NCC từ chối"
    PENDING_DEALER_CONFIRMATION = (
        "pending_dealer_confirmation",
        "Chờ đại lý xác nhận điều chỉnh",
    )
    CONFIRMED = "confirmed", "NCC đã xác nhận"
    DEPOSIT_PENDING_VERIFICATION = (
        "deposit_pending_verification",
        "Chờ xác nhận tiền cọc",
    )
    DEPOSIT_PAID = "deposit_paid", "Đã thanh toán cọc"
    PROCESSING = "processing", "Đang chuẩn bị hàng"
    SHIPPING = "shipping", "Đang giao hàng"
    DELIVERED = "delivered", "Đã giao hàng"
    FINAL_PAYMENT_PENDING_VERIFICATION = (
        "final_payment_pending_verification",
        "Chờ xác nhận thanh toán cuối",
    )
    RETURN_REQUESTED = "return_requested", "Yêu cầu trả hàng"
    RETURN_APPROVED = "return_approved", "Đã duyệt trả hàng"
    RETURN_REJECTED = "return_rejected", "Từ chối trả hàng"
    RETURNED = "returned", "Đã trả hàng"
    COMPLETED = "completed", "Hoàn tất"
    CANCELLED = "cancelled", "Đã hủy"


class PurchaseOrderPaymentMethod(models.TextChoices):
    """Phương thức thanh toán."""

    CASH = "cash", "Tiền mặt"
    BANK_TRANSFER = "bank_transfer", "Chuyển khoản"
    E_WALLET = "e_wallet", "Ví điện tử"


class PurchaseOrderPaymentType(models.TextChoices):
    """Loại thanh toán trong phiếu nhập."""

    DEPOSIT = "deposit", "Đặt cọc"
    FINAL_PAYMENT = "final_payment", "Thanh toán cuối"


class PurchaseOrderPaymentStatus(models.TextChoices):
    """Trạng thái xác minh thanh toán."""

    PENDING = "pending", "Chờ xác nhận"
    VERIFIED = "verified", "Đã xác nhận"
    REJECTED = "rejected", "Từ chối"
    CANCELLED = "cancelled", "Đã hủy"


class PurchaseOrderReturnStatus(models.TextChoices):
    """Trạng thái yêu cầu trả hàng phiếu nhập."""

    REQUESTED = "requested", "Chờ xử lý"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class PurchaseOrder(models.Model):
    """Phiếu nhập hàng từ đại lý tới nhà cung cấp."""

    order_code = models.CharField(max_length=50, unique=True)

    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )

    status = models.CharField(
        max_length=40,
        choices=PurchaseOrderStatus.choices,
        default=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
    )

    delivery_address = models.TextField()
    requested_delivery_time = models.DateTimeField(
        help_text="Thời gian giao mong muốn của đại lý (tham khảo cho NCC).",
    )
    confirmed_delivery_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Thời gian giao NCC cam kết — chốt khi confirm.",
    )
    receiver_name = models.CharField(max_length=255)
    receiver_phone = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    deposit_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Tỷ lệ đặt cọc (%), ví dụ 30",
    )
    deposit_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text="Tổng tiền đã xác nhận thanh toán",
    )
    debt_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text="Số tiền còn phải thanh toán",
    )
    credit_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text="Số tiền NCC cần hoàn lại khi đại lý đã trả thừa sau trả hàng",
    )

    confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_purchase_orders",
    )
    cancel_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "purchase_orders"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.order_code


class PurchaseOrderItemReviewStatus(models.TextChoices):
    """Trạng thái duyệt dòng SP khi NCC xác nhận phiếu."""

    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class PurchaseOrderItem(models.Model):
    """Dòng sản phẩm trong phiếu nhập — không gắn batch kho supplier."""

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    supplier_product = models.ForeignKey(
        "supplier_products.SupplierProduct",
        on_delete=models.PROTECT,
        related_name="purchase_order_items",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    original_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Số lượng dealer đặt ban đầu — dùng so sánh khi NCC điều chỉnh.",
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    base_unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Giá sỉ gốc tại thời điểm đặt (snapshot).",
    )
    discount_type = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Loại giảm theo SL: percent | fixed (rỗng nếu không giảm).",
    )
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Giá trị giảm (% hoặc VND) của bậc đã áp dụng.",
    )
    discount_min_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Ngưỡng số lượng tối thiểu của bậc giảm đã áp dụng.",
    )
    line_discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Tổng tiền giảm của dòng = (base - unit_price) × quantity.",
    )
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    note = models.TextField(blank=True)
    review_status = models.CharField(
        max_length=20,
        choices=PurchaseOrderItemReviewStatus.choices,
        default=PurchaseOrderItemReviewStatus.PENDING,
    )
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_order_items"
        ordering = ["id"]

    def __str__(self):
        return f"{self.purchase_order.order_code} - {self.supplier_product.name}"


class PurchaseOrderPayment(models.Model):
    """Lần thanh toán (cọc hoặc cuối) kèm biên lai."""

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PurchaseOrderPaymentMethod.choices,
    )
    payment_provider = models.CharField(max_length=50, blank=True)
    transaction_code = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    payment_type = models.CharField(
        max_length=20,
        choices=PurchaseOrderPaymentType.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=PurchaseOrderPaymentStatus.choices,
        default=PurchaseOrderPaymentStatus.PENDING,
    )

    receipt_file = models.FileField(upload_to="payment_receipts/", blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_purchase_order_payments",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    note = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "purchase_order_payments"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.purchase_order.order_code} - {self.payment_type}"


class PurchaseOrderStatusHistory(models.Model):
    """Lịch sử chuyển trạng thái phiếu nhập."""

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="status_histories",
    )
    old_status = models.CharField(max_length=40, blank=True)
    new_status = models.CharField(max_length=40)
    note = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="purchase_order_status_changes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "purchase_order_status_histories"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.purchase_order.order_code}: {self.old_status} → {self.new_status}"


class PurchaseOrderReturn(models.Model):
    """Yêu cầu trả hàng sau khi đại lý nhận phiếu nhập."""

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="returns",
    )
    status = models.CharField(
        max_length=20,
        choices=PurchaseOrderReturnStatus.choices,
        default=PurchaseOrderReturnStatus.REQUESTED,
    )
    reason = models.TextField()
    evidence_file = models.FileField(upload_to="purchase_order_returns/", blank=True)
    refund_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="requested_purchase_order_returns",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_purchase_order_returns",
    )
    review_note = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "purchase_order_returns"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.purchase_order.order_code} - {self.status}"


class PurchaseOrderReturnItem(models.Model):
    """Dòng sản phẩm trong yêu cầu trả phiếu nhập."""

    purchase_order_return = models.ForeignKey(
        PurchaseOrderReturn,
        on_delete=models.CASCADE,
        related_name="items",
    )
    purchase_order_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.PROTECT,
        related_name="return_items",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_order_return_items"
        ordering = ["id"]

    def __str__(self):
        return f"{self.purchase_order_return} - {self.purchase_order_item_id}"

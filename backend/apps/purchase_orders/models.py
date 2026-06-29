"""Phiếu nhập hàng đại lý từ nhà cung cấp (thu hoạch theo đơn, không kho supplier).

=== CÁC BẢNG LIÊN QUAN ===
- PurchaseOrder        : phiếu nhập (header đơn)
- PurchaseOrderItem    : dòng sản phẩm (snapshot giá sỉ)
- PurchaseOrderPayment : lần thanh toán cọc / cuối + biên lai
- PurchaseOrderStatusHistory : audit log chuyển trạng thái

=== LUỒNG TRẠNG THÁI (xem services.py) ===
pending_supplier_confirmation → confirmed → deposit_pending_verification
→ processing → shipping → delivered → final_payment_pending_verification → completed
Nhánh từ chối: rejected | hủy: cancelled
"""

from django.conf import settings
from django.db import models


class PurchaseOrderStatus(models.TextChoices):
    """Trạng thái phiếu nhập hàng."""

    PENDING_SUPPLIER_CONFIRMATION = (
        "pending_supplier_confirmation",
        "Chờ NCC xác nhận",
    )
    REJECTED = "rejected", "NCC từ chối"
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

    confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "purchase_orders"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.order_code


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
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    note = models.TextField(blank=True)

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

"""Đơn hàng buyer trên gian hàng đại lý (B2C storefront)."""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class OrderStatus(models.TextChoices):
    """Trạng thái đơn hàng buyer."""

    PENDING = "pending", "Chờ xác nhận"
    CONFIRMED = "confirmed", "Đã xác nhận"
    PROCESSING = "processing", "Đang chuẩn bị"
    SHIPPING = "shipping", "Đang giao"
    DELIVERED = "delivered", "Đã giao"
    COMPLETED = "completed", "Hoàn tất"
    CANCEL_REQUESTED = "cancel_requested", "Yêu cầu hủy"
    DELIVERY_FAILED = "delivery_failed", "Giao thất bại"
    RETURN_REQUESTED = "return_requested", "Yêu cầu trả hàng"
    RETURN_APPROVED = "return_approved", "Đã duyệt trả hàng"
    RETURN_REJECTED = "return_rejected", "Từ chối trả hàng"
    RETURNED = "returned", "Đã trả hàng"
    CANCELLED = "cancelled", "Đã hủy"


class CustomerPaymentMethod(models.TextChoices):
    """Phương thức thanh toán buyer."""

    CASH = "cash", "Tiền mặt"
    BANK_TRANSFER = "bank_transfer", "Chuyển khoản"
    E_WALLET = "e_wallet", "Ví điện tử"


class CustomerPaymentProvider(models.TextChoices):
    """Nhà cung cấp ví / cổng thanh toán."""

    MOMO = "momo", "MoMo"
    VNPAY = "vnpay", "VNPay"


class CustomerPaymentType(models.TextChoices):
    """Loại thanh toán trên đơn buyer."""

    FULL = "full", "Thanh toán đủ"
    COD = "cod", "Thanh toán khi nhận hàng"


class CustomerPaymentStatus(models.TextChoices):
    """Trạng thái thanh toán buyer."""

    PENDING = "pending", "Chờ thanh toán"
    PAID = "paid", "Đã thanh toán"
    FAILED = "failed", "Thất bại"
    REFUNDED = "refunded", "Đã hoàn tiền"
    CANCELLED = "cancelled", "Đã hủy"


class OrderReturnStatus(models.TextChoices):
    """Trạng thái yêu cầu trả hàng buyer."""

    REQUESTED = "requested", "Chờ xử lý"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class Order(models.Model):
    """Header đơn hàng buyer tại một gian hàng đại lý."""

    order_code = models.CharField(max_length=50, unique=True)

    customer = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.PROTECT,
        related_name="customer_orders",
    )
    customer_address = models.ForeignKey(
        "customers.CustomerAddress",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        help_text="Địa chỉ gốc buyer chọn — snapshot lưu ở receiver/delivery fields",
    )

    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )

    receiver_name = models.CharField(max_length=255)
    receiver_phone = models.CharField(max_length=20)
    delivery_address = models.TextField()
    delivery_time = models.DateTimeField()
    note = models.TextField(blank=True)

    subtotal_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    debt_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text="Số tiền còn phải thanh toán",
    )

    delivered_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_customer_orders",
    )
    cancel_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["dealer", "status"]),
            models.Index(fields=["customer", "-created_at"]),
        ]

    def __str__(self):
        return self.order_code


class OrderItem(models.Model):
    """Dòng sản phẩm trong đơn — snapshot giá và tên tại thời điểm đặt."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    dealer_product = models.ForeignKey(
        "dealer_products.DealerProduct",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    batch = models.ForeignKey(
        "dealer_products.DealerInventoryBatch",
        on_delete=models.PROTECT,
        related_name="order_items",
    )

    product_title = models.CharField(max_length=255)
    unit = models.CharField(max_length=50, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    import_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Giá nhập snapshot — phục vụ báo cáo margin đại lý",
    )
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "order_items"
        ordering = ["id"]

    def __str__(self):
        return f"{self.order.order_code} - {self.product_title}"


class OrderStatusHistory(models.Model):
    """Audit log chuyển trạng thái đơn buyer."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="status_histories",
    )
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customer_order_status_changes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "order_status_histories"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.order.order_code}: {self.old_status} → {self.new_status}"


class CustomerPayment(models.Model):
    """Lần thanh toán trên đơn hàng buyer."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    payment_method = models.CharField(
        max_length=20,
        choices=CustomerPaymentMethod.choices,
    )
    payment_provider = models.CharField(
        max_length=50,
        choices=CustomerPaymentProvider.choices,
        blank=True,
    )
    payment_type = models.CharField(
        max_length=20,
        choices=CustomerPaymentType.choices,
        default=CustomerPaymentType.FULL,
    )
    transaction_code = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=CustomerPaymentStatus.choices,
        default=CustomerPaymentStatus.PENDING,
    )

    receipt_file = models.FileField(upload_to="customer_payment_receipts/", blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_customer_payments",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    note = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "customer_payments"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["payment_provider", "transaction_code"],
                condition=models.Q(
                    transaction_code__gt="",
                    payment_provider__gt="",
                ),
                name="unique_customer_payment_provider_transaction",
            ),
        ]

    def __str__(self):
        return f"{self.order.order_code} - {self.payment_method} ({self.status})"


class OrderReturn(models.Model):
    """Yêu cầu trả hàng của buyer sau khi đơn hoàn tất."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="returns",
    )
    status = models.CharField(
        max_length=20,
        choices=OrderReturnStatus.choices,
        default=OrderReturnStatus.REQUESTED,
    )
    reason = models.TextField()
    evidence_file = models.FileField(upload_to="customer_order_returns/", blank=True)
    refund_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="requested_customer_order_returns",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_customer_order_returns",
    )
    review_note = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "order_returns"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.order.order_code} - {self.status}"


class OrderReturnItem(models.Model):
    """Dòng sản phẩm trong yêu cầu trả hàng buyer."""

    order_return = models.ForeignKey(
        OrderReturn,
        on_delete=models.CASCADE,
        related_name="items",
    )
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.PROTECT,
        related_name="return_items",
    )
    quantity = models.PositiveIntegerField()
    reason = models.TextField(blank=True)

    class Meta:
        db_table = "order_return_items"
        ordering = ["id"]

    def __str__(self):
        return f"{self.order_return} - {self.order_item_id}"

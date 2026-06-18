"""Khuyến mãi và voucher trên gian hàng đại lý."""

from django.conf import settings
from django.db import models


class PromotionStatus(models.TextChoices):
    """Trạng thái chương trình khuyến mãi."""

    DRAFT = "draft", "Nháp"
    ACTIVE = "active", "Đang chạy"
    INACTIVE = "inactive", "Tạm dừng"
    EXPIRED = "expired", "Hết hạn"


class PromotionDiscountType(models.TextChoices):
    """Loại giảm giá."""

    PERCENT = "percent", "Theo phần trăm"
    FIXED = "fixed", "Số tiền cố định"


class PromotionTargetType(models.TextChoices):
    """Đối tượng áp dụng khuyến mãi."""

    ALL = "all", "Tất cả khách / sản phẩm"
    SEGMENT = "segment", "Theo nhóm khách"
    PRODUCT = "product", "Theo sản phẩm đại lý"
    CATEGORY = "category", "Theo danh mục"


class Promotion(models.Model):
    """Chương trình khuyến mãi — dealer hoặc admin (dealer=null)."""

    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="promotions",
        help_text="null = khuyến mãi toàn sàn do admin tạo",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_promotions",
    )

    title = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, help_text="Mã voucher, vd. SUMMER10")
    description = models.TextField(blank=True)

    discount_type = models.CharField(
        max_length=20,
        choices=PromotionDiscountType.choices,
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)

    min_order_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )
    max_discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Trần giảm khi discount_type=percent",
    )
    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Tổng lượt dùng tối đa — null = không giới hạn",
    )
    usage_limit_per_customer = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Lượt dùng tối đa mỗi khách — null = không giới hạn",
    )

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=PromotionStatus.choices,
        default=PromotionStatus.DRAFT,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "promotions"
        ordering = ["-start_date", "-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["dealer", "code"],
                condition=models.Q(code__gt=""),
                name="unique_promotion_code_per_dealer",
            ),
        ]

    def __str__(self):
        scope = self.dealer.store_name if self.dealer_id else "Platform"
        return f"[{scope}] {self.title}"


class PromotionTarget(models.Model):
    """Đối tượng áp dụng của một khuyến mãi."""

    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.CASCADE,
        related_name="targets",
    )
    target_type = models.CharField(
        max_length=20,
        choices=PromotionTargetType.choices,
    )
    segment = models.ForeignKey(
        "marketing.CustomerSegment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="promotion_targets",
    )
    dealer_product = models.ForeignKey(
        "dealer_products.DealerProduct",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="promotion_targets",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="promotion_targets",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "promotion_targets"
        ordering = ["id"]

    def __str__(self):
        return f"{self.promotion.title} → {self.target_type}"


class PromotionUsage(models.Model):
    """Lịch sử áp dụng khuyến mãi trên đơn hàng."""

    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.PROTECT,
        related_name="usages",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="promotion_usages",
    )
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "promotion_usages"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["promotion", "order"],
                name="unique_promotion_usage_per_order",
            ),
        ]

    def __str__(self):
        return f"{self.promotion.title} on {self.order.order_code}"

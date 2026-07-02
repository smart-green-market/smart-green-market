"""Chính sách giảm giá tự động theo khung giờ."""

from django.db import models


class AgeDiscountScope(models.TextChoices):
    ALL = "all", "Tất cả sản phẩm"
    CATEGORY = "category", "Theo danh mục"
    DEALER_PRODUCT = "dealer_product", "Theo sản phẩm đại lý"


class AgeDiscountDiscountType(models.TextChoices):
    PERCENT = "percent", "Theo phần trăm"
    FIXED = "fixed", "Số tiền cố định"


class AgeDiscountPolicy(models.Model):
    """Chính sách giảm giá tự động theo thời gian — cấu hình bởi dealer."""

    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="age_discount_policies",
    )
    title = models.CharField(max_length=255)
    scope = models.CharField(max_length=20, choices=AgeDiscountScope.choices)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="age_discount_policies",
    )
    dealer_product = models.ForeignKey(
        "dealer_products.DealerProduct",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="age_discount_policies",
    )
    discount_type = models.CharField(
        max_length=10,
        choices=AgeDiscountDiscountType.choices,
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)
    priority = models.PositiveIntegerField(
        default=0,
        help_text="Cao hơn thắng khi nhiều policy cùng scope",
    )
    is_active = models.BooleanField(default=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "age_discount_policies"
        ordering = ["-priority", "-updated_at", "-id"]

    def __str__(self):
        return f"{self.dealer.store_name} — {self.title}"

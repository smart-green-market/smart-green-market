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
    daily_start_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Giờ bắt đầu áp dụng mỗi ngày",
    )
    daily_end_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Giờ kết thúc áp dụng mỗi ngày",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "age_discount_policies"
        ordering = ["-priority", "-updated_at", "-id"]

    def __str__(self):
        return f"{self.dealer.store_name} — {self.title}"

    def is_within_daily_time(self, at=None):
        if self.daily_start_time is None or self.daily_end_time is None:
            return True

        from django.utils import timezone

        at = at or timezone.now()
        current_time = timezone.localtime(at).time()
        start_time = self.daily_start_time
        end_time = self.daily_end_time

        if start_time <= end_time:
            return start_time <= current_time <= end_time
        return current_time >= start_time or current_time <= end_time

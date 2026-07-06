"""Chính sách giảm giá theo số lượng đặt hàng — cấu hình bởi NCC."""

from django.db import models


class QuantityDiscountScope(models.TextChoices):
    ALL = "all", "Tất cả sản phẩm"
    CATEGORY = "category", "Theo danh mục"
    SUPPLIER_PRODUCT = "supplier_product", "Theo sản phẩm NCC"


class QuantityDiscountType(models.TextChoices):
    PERCENT = "percent", "Theo phần trăm"
    FIXED = "fixed", "Số tiền cố định"


class QuantityDiscountPolicy(models.Model):
    """Chính sách giảm giá B2B theo số lượng đặt — cấu hình bởi nhà cung cấp."""

    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.CASCADE,
        related_name="quantity_discount_policies",
    )
    title = models.CharField(max_length=255)
    scope = models.CharField(max_length=20, choices=QuantityDiscountScope.choices)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quantity_discount_policies",
    )
    supplier_product = models.ForeignKey(
        "supplier_products.SupplierProduct",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quantity_discount_policies",
    )
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
        db_table = "quantity_discount_policies"
        ordering = ["-priority", "-updated_at", "-id"]

    def __str__(self):
        return f"{self.supplier.company_name} — {self.title}"


class QuantityDiscountTier(models.Model):
    """Bậc giảm giá theo ngưỡng số lượng tối thiểu."""

    policy = models.ForeignKey(
        QuantityDiscountPolicy,
        on_delete=models.CASCADE,
        related_name="tiers",
    )
    min_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Số lượng tối thiểu để áp dụng bậc giảm",
    )
    discount_type = models.CharField(
        max_length=10,
        choices=QuantityDiscountType.choices,
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "quantity_discount_tiers"
        ordering = ["sort_order", "min_quantity", "id"]

    def __str__(self):
        return f"{self.policy.title} — từ {self.min_quantity}"

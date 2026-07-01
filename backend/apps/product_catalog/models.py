"""Product Master — catalog sản phẩm chuẩn hệ thống."""

from django.db import models


class ProductMasterStatus(models.TextChoices):
    ACTIVE = "active", "Hoạt động"
    INACTIVE = "inactive", "Ngừng dùng"


class ProductMaster(models.Model):
    """Sản phẩm chuẩn — gắn danh mục system; admin tạo, NCC chọn khi đăng bán."""

    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="product_masters",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    default_unit = models.CharField(max_length=50, help_text="Đơn vị mặc định (kg, bó...)")
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=ProductMasterStatus.choices,
        default=ProductMasterStatus.ACTIVE,
    )
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product_masters"
        ordering = ["sort_order", "name", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["category", "slug"],
                name="unique_product_master_slug_per_category",
            ),
        ]

    def __str__(self):
        return self.name

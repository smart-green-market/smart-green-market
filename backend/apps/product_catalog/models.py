"""Product Master — catalog sản phẩm chuẩn hệ thống."""

from django.db import models


class ProductMasterStatus(models.TextChoices):
    ACTIVE = "active", "Hoạt động"
    INACTIVE = "inactive", "Ngừng dùng"


class SeasonStatus(models.TextChoices):
    ACTIVE = "active", "Hoạt động"
    INACTIVE = "inactive", "Ngừng dùng"


class Season(models.Model):
    """Mùa vụ — admin quản lý, gắn với Product Master qua M2M."""

    code = models.SlugField(max_length=50, unique=True, help_text="Mã slug, vd. spring, summer")
    name = models.CharField(max_length=100, help_text="Tên hiển thị, vd. Xuân, Hè")
    description = models.TextField(blank=True)
    start_month = models.PositiveSmallIntegerField(help_text="Tháng bắt đầu (1–12)")
    end_month = models.PositiveSmallIntegerField(help_text="Tháng kết thúc (1–12)")
    sort_order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=SeasonStatus.choices,
        default=SeasonStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "seasons"
        ordering = ["sort_order", "name", "id"]

    def __str__(self):
        return self.name


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
    seasons = models.ManyToManyField(
        Season,
        related_name="product_masters",
        blank=True,
        help_text="Mùa vụ thu hoạch / tiêu thụ điển hình của sản phẩm",
    )
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

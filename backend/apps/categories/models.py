"""Model danh mục sản phẩm nông sản."""

from django.conf import settings
from django.db import models


class CategoryStatus(models.TextChoices):
    """Các trạng thái duyệt và hoạt động của danh mục."""

    PENDING = "pending", "Chờ duyệt"
    ACTIVE = "active", "Hoạt động"
    INACTIVE = "inactive", "Đã khóa"
    REJECTED = "rejected", "Từ chối"


class Category(models.Model):
    """Danh mục sản phẩm — NCC gắn SupplierProduct; đại lý gắn DealerProduct."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=CategoryStatus.choices,
        default=CategoryStatus.PENDING,
    )
    sort_order = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_categories",
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_categories",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Cấu hình bảng và thứ tự mặc định."""

        db_table = "categories"
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        """Trả về tên danh mục."""
        return self.name

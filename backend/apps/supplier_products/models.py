"""Model sản phẩm nhà cung cấp, ảnh và quy trình canh tác."""

from django.conf import settings
from django.db import models


class SupplierProductStatus(models.TextChoices):
    """Các trạng thái duyệt và hoạt động của sản phẩm."""

    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    REJECTED = "rejected", "Rejected"
    DELETED = "deleted", "Deleted"


class SupplierProduct(models.Model):
    """Sản phẩm nông sản do nhà cung cấp đăng bán."""

    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.CASCADE,
        related_name="products",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="supplier_products",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    unit = models.CharField(max_length=50)
    wholesale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Giá bán sỉ cho đại lý (snapshot vào phiếu nhập khi tạo đơn)",
    )
    daily_production_capacity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Năng lực sản xuất trung bình mỗi ngày (cùng đơn vị với unit)",
    )
    description = models.TextField(blank=True, null=True)

    storage_duration_days = models.IntegerField(blank=True, null=True)
    min_storage_temp = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    max_storage_temp = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)


    status = models.CharField(
        max_length=20,
        choices=SupplierProductStatus.choices,
        default=SupplierProductStatus.PENDING,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_supplier_products",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Cấu hình bảng, ràng buộc slug duy nhất theo nhà cung cấp."""

        db_table = "supplier_products"
        verbose_name = "Supplier Product"
        verbose_name_plural = "Supplier Products"
        ordering = ["-updated_at", "-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["supplier", "slug"],
                name="unique_supplier_product_slug",
            )
        ]

    def __str__(self):
        """Trả về tên sản phẩm."""
        return self.name
    
class SupplierProductImage(models.Model):
    """Ảnh minh họa sản phẩm, có thể đặt làm ảnh đại diện."""

    supplier_product = models.ForeignKey(
        SupplierProduct,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image_url = models.FileField(upload_to="product_images/")
    is_thumbnail = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Cấu hình bảng và thứ tự hiển thị ảnh."""

        db_table = "supplier_product_images"
        ordering = ["sort_order", "id"]
        
class CultivationProcess(models.Model):
    """Một bước trong quy trình canh tác của sản phẩm."""

    supplier_product = models.ForeignKey(
        SupplierProduct,
        on_delete=models.CASCADE,
        related_name="cultivation_processes",
    )
    step_order = models.IntegerField()
    process_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Cấu hình bảng và ràng buộc thứ tự bước duy nhất theo sản phẩm."""

        db_table = "cultivation_processes"
        ordering = ["step_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["supplier_product", "step_order"],
                name="unique_product_step_order",
            )
        ]

    def __str__(self):
        """Trả về mô tả ngắn bước quy trình canh tác."""
        return f"{self.supplier_product.name} - Bước {self.step_order}: {self.process_name}"

from django.conf import settings
from django.db import models


class SupplierProductStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    REJECTED = "rejected", "Rejected"
    DELETED = "deleted", "Deleted"


class SupplierProduct(models.Model):
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
        db_table = "supplier_products"
        verbose_name = "Supplier Product"
        verbose_name_plural = "Supplier Products"
        constraints = [
            models.UniqueConstraint(
                fields=["supplier", "slug"],
                name="unique_supplier_product_slug",
            )
        ]

    def __str__(self):
        return self.name
    
class SupplierProductImage(models.Model):
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
        db_table = "supplier_product_images"
        ordering = ["sort_order", "id"]
        
class CultivationProcess(models.Model):
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
        db_table = "cultivation_processes"
        ordering = ["step_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["supplier_product", "step_order"],
                name="unique_product_step_order",
            )
        ]

    def __str__(self):
        return f"{self.supplier_product.name} - Bước {self.step_order}: {self.process_name}"
"""Model sản phẩm đại lý, ảnh và quản lý tồn kho."""

from django.conf import settings
from django.db import models


class DealerProductStatus(models.TextChoices):
    """Các trạng thái duyệt và hoạt động của sản phẩm đại lý."""

    PENDING = "pending", "Chờ duyệt"
    ACTIVE = "active", "Đang bán"
    INACTIVE = "inactive", "Ngừng bán"
    REJECTED = "rejected", "Từ chối"
    DELETED = "deleted", "Đã xóa"


class DealerInventoryBatchStatus(models.TextChoices):
    """Trạng thái lô hàng tồn kho đại lý."""

    ACTIVE = "active", "Đang hoạt động"
    DEPLETED = "depleted", "Hết hàng"
    EXPIRED = "expired", "Hết hạn"
    CANCELLED = "cancelled", "Đã hủy"


class DealerInventoryTransactionType(models.TextChoices):
    """Loại giao dịch biến động tồn kho."""

    IMPORT = "import", "Nhập kho"
    SALE = "sale", "Bán hàng"
    WASTAGE = "wastage", "Hao hụt"
    ADJUSTMENT = "adjustment", "Điều chỉnh"


class DealerProduct(models.Model):
    """Sản phẩm đại lý bán lẻ, liên kết với sản phẩm nhà cung cấp gốc."""

    dealer_profile = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="products",
    )
    supplier_product = models.ForeignKey(
        "supplier_products.SupplierProduct",
        on_delete=models.PROTECT,
        related_name="dealer_products",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="dealer_store_products",
        null=True,
        blank=True,
        help_text="Danh mục bán lẻ do đại lý tạo và quản lý",
    )

    retail_price = models.DecimalField(max_digits=12, decimal_places=2)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    thumbnail = models.CharField(max_length=500, blank=True)

    status = models.CharField(
        max_length=20,
        choices=DealerProductStatus.choices,
        default=DealerProductStatus.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dealer_products"
        verbose_name = "Dealer Product"
        verbose_name_plural = "Dealer Products"
        ordering = ["-updated_at", "-created_at", "-id"]

    def __str__(self):
        return self.title


class DealerProductImage(models.Model):
    """Ảnh minh họa sản phẩm đại lý."""

    dealer_product = models.ForeignKey(
        DealerProduct,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image_url = models.CharField(max_length=500)
    is_thumbnail = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dealer_product_images"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.dealer_product.title} - ảnh #{self.id}"


class DealerInventoryBatch(models.Model):
    """Lô hàng tồn kho của sản phẩm đại lý."""

    dealer_product = models.ForeignKey(
        DealerProduct,
        on_delete=models.CASCADE,
        related_name="inventory_batches",
    )
    purchase_order_item = models.ForeignKey(
        "purchase_orders.PurchaseOrderItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dealer_inventory_batches",
    )

    batch_number = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    import_price = models.DecimalField(max_digits=12, decimal_places=2)

    import_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=DealerInventoryBatchStatus.choices,
        default=DealerInventoryBatchStatus.ACTIVE,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dealer_inventory_batches"
        ordering = ["-import_date", "-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["dealer_product", "batch_number"],
                name="unique_dealer_product_batch_number",
            )
        ]

    def __str__(self):
        return f"{self.dealer_product.title} - {self.batch_number}"


class DealerInventoryWastage(models.Model):
    """Ghi nhận hao hụt tồn kho theo lô hàng."""

    batch = models.ForeignKey(
        DealerInventoryBatch,
        on_delete=models.CASCADE,
        related_name="wastages",
    )
    quantity = models.PositiveIntegerField()
    reason = models.CharField(max_length=255)
    note = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="dealer_inventory_wastages",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dealer_inventory_wastages"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"Hao hụt lô {self.batch.batch_number} - {self.quantity}"


class DealerInventoryTransaction(models.Model):
    """Lịch sử biến động số lượng tồn kho theo lô hàng."""

    batch = models.ForeignKey(
        DealerInventoryBatch,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    type = models.CharField(
        max_length=20,
        choices=DealerInventoryTransactionType.choices,
    )

    quantity_before = models.IntegerField()
    quantity_change = models.IntegerField()
    quantity_after = models.IntegerField()
    reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="dealer_inventory_transactions",
    )

    class Meta:
        db_table = "dealer_inventory_transactions"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.type} lô {self.batch.batch_number}: {self.quantity_change}"

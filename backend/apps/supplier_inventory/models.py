# Create your models here.
from django.db import models

# apps/supplier_inventory/models.py
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db.models import Q


class InventoryBatch(models.Model):
    supplier_product = models.ForeignKey(
        'supplier_products.SupplierProduct',
        on_delete=models.CASCADE,
        related_name='inventory_batches'
    )

    batch_number = models.CharField(max_length=100, unique=True)

    quantity = models.PositiveBigIntegerField(
        validators=[MinValueValidator(0)]
    )

    remaining_quantity = models.PositiveBigIntegerField(
        validators=[MinValueValidator(0)]
    )

    import_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    import_date = models.DateField()
    expiry_date = models.DateField()

    storage_condition = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=50, default='active')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supplier_inventory_batches'
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gte=0),
                name="batch_quantity_gte_0"
            ),
            models.CheckConstraint(
                condition=Q(remaining_quantity__gte=0),
                name="remaining_quantity_gte_0"
            ),
            models.CheckConstraint(
                condition=Q(import_price__gte=0),
                name="import_price_gte_0"
            ),
            models.CheckConstraint(
                condition=Q(selling_price__gte=0),
                name="selling_price_gte_0"
            ),
        ]
    def __str__(self):
        return self.batch_number

class InventoryWastage(models.Model):

    batch = models.ForeignKey(
        'supplier_inventory.InventoryBatch',
        on_delete=models.CASCADE,
        related_name='wastages'
    )

    quantity = models.PositiveBigIntegerField(validators=[MinValueValidator(0)])

    reason = models.CharField(max_length=255)

    note = models.TextField(
        blank=True,
        null=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = 'supplier_inventory_wastages'

    def __str__(self):
        return f'Wastage #{self.id}'
    

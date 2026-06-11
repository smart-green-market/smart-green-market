from .models import InventoryBatch
from django.db import transaction

def allocate_fifo(supplier_product, quantity):
    with transaction.atomic():
        batches = InventoryBatch.objects.select_for_update().filter(
            supplier_product=supplier_product,
            remaining_quantity__gt=0,
            status="active",
        ).order_by("import_date")

        if not batches.exists():
            raise ValueError("Không có lô hàng nào khả dụng")

        total_available = sum(b.remaining_quantity for b in batches)
        if total_available < quantity:
            raise ValueError(
                f"Không đủ tồn kho. Cần {quantity}, chỉ còn {total_available}"
            )

        remaining = quantity
        for batch in batches:
            if remaining <= 0:
                break

            deduct = min(batch.remaining_quantity, remaining)
            batch.remaining_quantity -= deduct
            remaining -= deduct

            if batch.remaining_quantity == 0:
                batch.status = "out_of_stock"

            batch.save()

def deduct_batch_stock(batch, quantity):

    if quantity > batch.remaining_quantity:
        raise ValueError("Không đủ tồn kho")

    batch.remaining_quantity -= quantity

    if batch.remaining_quantity == 0:
        batch.status = "sold_out"

    batch.save()
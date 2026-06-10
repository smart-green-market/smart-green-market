"""Logic nghiệp vụ tồn kho đại lý."""

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerInventoryWastage,
)


@transaction.atomic
def record_wastage(*, batch, quantity, reason, note, user):
    """Ghi nhận hao hụt và cập nhật tồn lô hàng."""
    if batch.status != DealerInventoryBatchStatus.ACTIVE:
        raise ValidationError({"detail": "Chỉ ghi hao hụt trên lô đang active."})
    if quantity <= 0:
        raise ValidationError({"quantity": "Số lượng phải lớn hơn 0."})
    if quantity > batch.remaining_quantity:
        raise ValidationError(
            {
                "quantity": (
                    f"Vượt tồn còn lại ({batch.remaining_quantity})."
                )
            }
        )

    before = batch.remaining_quantity
    after = before - quantity
    batch.remaining_quantity = after
    if after == 0:
        batch.status = DealerInventoryBatchStatus.DEPLETED
    batch.save(update_fields=["remaining_quantity", "status", "updated_at"])

    wastage = DealerInventoryWastage.objects.create(
        batch=batch,
        quantity=quantity,
        reason=reason,
        note=note or "",
        created_by=user,
    )
    DealerInventoryTransaction.objects.create(
        batch=batch,
        type=DealerInventoryTransactionType.WASTAGE,
        quantity_before=before,
        quantity_change=-quantity,
        quantity_after=after,
        reason=reason + (f" — {note}" if note else ""),
        created_by=user,
    )
    return wastage

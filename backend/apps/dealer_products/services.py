"""Logic nghiệp vụ tồn kho đại lý."""

from django.db import transaction
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerInventoryWastage,
)


def _sellable_batch_filter():
    """Lô MAIN còn bán được: active, còn tồn, chưa xóa."""
    from .canonical_inventory import CANONICAL_BATCH_NUMBER

    return Q(
        inventory_batches__batch_number=CANONICAL_BATCH_NUMBER,
        inventory_batches__status=DealerInventoryBatchStatus.ACTIVE,
        inventory_batches__remaining_quantity__gt=0,
        inventory_batches__deleted_at__isnull=True,
    )


def _on_hand_batch_filter():
    """Mọi lô chưa xóa — tổng tồn thực tế (kể cả hết hạn / depleted)."""
    return Q(inventory_batches__deleted_at__isnull=True)


def annotate_dealer_product_stock(qs):
    """Gắn imported/total/available quantity lên queryset sản phẩm đại lý."""
    return qs.annotate(
        imported_quantity=Coalesce(
            Sum(
                "inventory_batches__quantity",
                filter=_on_hand_batch_filter(),
            ),
            0,
        ),
        total_quantity=Coalesce(
            Sum(
                "inventory_batches__remaining_quantity",
                filter=_on_hand_batch_filter(),
            ),
            0,
        ),
        available_quantity=Coalesce(
            Sum(
                "inventory_batches__remaining_quantity",
                filter=_sellable_batch_filter(),
            ),
            0,
        ),
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

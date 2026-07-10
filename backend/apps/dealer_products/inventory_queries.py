"""Queryset lô tồn kho bán được — lô MAIN duy nhất / sản phẩm."""

from .models import DealerInventoryBatch, DealerInventoryBatchStatus


def get_sellable_batches_qs(dealer_product, *, for_update=False):
    """Lô MAIN còn tồn — không lọc HSD (đại lý tự kiểm tra thực tế)."""
    from .canonical_inventory import CANONICAL_BATCH_NUMBER

    qs = DealerInventoryBatch.objects.filter(
        dealer_product=dealer_product,
        batch_number=CANONICAL_BATCH_NUMBER,
        status=DealerInventoryBatchStatus.ACTIVE,
        remaining_quantity__gt=0,
        deleted_at__isnull=True,
    ).order_by("id")
    if for_update:
        qs = qs.select_for_update()
    return qs


def sellable_batch_dates_for_display(dealer_product, *, today=None):
    """
    Ngày sản xuất / hết hạn lô FIFO buyer sẽ nhận — lấy trực tiếp từ dữ liệu lô tồn kho.
    """
    from django.utils import timezone

    today = today or timezone.localdate()
    batch = (
        get_sellable_batches_qs(dealer_product)
        .only("production_date", "expiry_date")
        .first()
    )
    if not batch:
        return {
            "production_date": None,
            "expiry_date": None,
            "days_to_expiry": None,
        }
    days_to_expiry = None
    if batch.expiry_date:
        days_to_expiry = (batch.expiry_date - today).days
    return {
        "production_date": batch.production_date,
        "expiry_date": batch.expiry_date,
        "days_to_expiry": days_to_expiry,
    }

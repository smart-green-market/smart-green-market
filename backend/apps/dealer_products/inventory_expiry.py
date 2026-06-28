"""Ngày hết hạn lô tồn kho đại lý."""

from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import DealerInventoryBatch, DealerInventoryBatchStatus

# Giới hạn nghiệp vụ — tránh giá trị placeholder (vd. 2147483647) gây OverflowError.
MAX_STORAGE_DURATION_DAYS = 3650


def normalize_storage_duration_days(days):
    """Trả về số ngày hợp lệ hoặc None nếu không dùng được."""
    if days is None:
        return None
    try:
        days = int(days)
    except (TypeError, ValueError):
        return None
    if days <= 0 or days > MAX_STORAGE_DURATION_DAYS:
        return None
    return days


def resolve_storage_duration_days(supplier_product, *, fallback_days=None):
    """Lấy số ngày bảo quản từ SP NCC, hoặc fallback khi giá trị SP không hợp lệ."""
    days = normalize_storage_duration_days(
        getattr(supplier_product, "storage_duration_days", None)
    )
    if days is None and fallback_days is not None:
        days = normalize_storage_duration_days(fallback_days)
    return days


def compute_batch_expiry_date(import_date, supplier_product, *, fallback_days=None):
    """Tính expiry_date = import_date + storage_duration_days (SP NCC)."""
    days = resolve_storage_duration_days(supplier_product, fallback_days=fallback_days)
    if days is None:
        return None
    try:
        return import_date + timedelta(days=days)
    except OverflowError:
        return None


def fix_invalid_supplier_storage_duration_days(
    *,
    default_days,
    supplier_id=None,
    dealer_profile_id=None,
):
    """
    Sửa SP NCC có storage_duration_days placeholder / không hợp lệ.
    Trả về số bản ghi đã cập nhật.
    """
    from django.db.models import Q

    from apps.supplier_products.models import SupplierProduct

    normalized = normalize_storage_duration_days(default_days)
    if normalized is None:
        raise ValidationError(
            {"default_storage_days": f"Phải từ 1 đến {MAX_STORAGE_DURATION_DAYS}."}
        )

    qs = SupplierProduct.objects.filter(
        Q(storage_duration_days__gt=MAX_STORAGE_DURATION_DAYS)
        | Q(storage_duration_days__lte=0)
    )
    if supplier_id is not None:
        qs = qs.filter(supplier_id=supplier_id)
    if dealer_profile_id is not None:
        qs = qs.filter(dealer_products__dealer_profile_id=dealer_profile_id).distinct()
    return qs.update(storage_duration_days=normalized)


def _sync_batch_status_after_expiry_change(batch):
    """Cập nhật status ACTIVE/EXPIRED theo expiry_date mới."""
    today = timezone.localdate()
    if batch.expiry_date is None:
        return batch
    if batch.expiry_date < today:
        if batch.status == DealerInventoryBatchStatus.ACTIVE:
            batch.status = DealerInventoryBatchStatus.EXPIRED
            batch.save(update_fields=["status", "updated_at"])
    elif (
        batch.status == DealerInventoryBatchStatus.EXPIRED
        and batch.remaining_quantity > 0
        and batch.deleted_at is None
    ):
        batch.status = DealerInventoryBatchStatus.ACTIVE
        batch.save(update_fields=["status", "updated_at"])
    return batch


def set_batch_expiry_date(batch, expiry_date):
    """Gán expiry_date thủ công cho lô."""
    if expiry_date < batch.import_date:
        raise ValidationError(
            {"expiry_date": "Ngày hết hạn phải >= ngày nhập kho."}
        )
    batch.expiry_date = expiry_date
    batch.save(update_fields=["expiry_date", "updated_at"])
    return _sync_batch_status_after_expiry_change(batch)


def recompute_batch_expiry_date(batch, *, fallback_days=None):
    """Tính lại expiry_date từ import_date + storage_duration_days (SP NCC)."""
    supplier_product = getattr(batch.dealer_product, "supplier_product", None)
    if supplier_product is None:
        raise ValidationError({"detail": "Sản phẩm đại lý không liên kết sản phẩm NCC."})
    expiry_date = compute_batch_expiry_date(
        batch.import_date,
        supplier_product,
        fallback_days=fallback_days,
    )
    if expiry_date is None:
        raise ValidationError(
            {
                "detail": (
                    "Sản phẩm NCC chưa có storage_duration_days hợp lệ. "
                    "Cập nhật SP NCC hoặc gọi backfill với default_storage_days."
                )
            }
        )
    return set_batch_expiry_date(batch, expiry_date)


def backfill_batch_expiry_dates(
    *,
    dealer_profile_id=None,
    only_null=True,
    recompute=False,
    dry_run=False,
    fallback_storage_days=None,
    fix_supplier_products=False,
):
    """
    Backfill expiry_date cho lô cũ.
    Trả về dict: updated, skipped, fixed_supplier_products, skipped_batches.
    """
    fixed_supplier_products = 0
    if fix_supplier_products and fallback_storage_days is not None:
        fixed_supplier_products = fix_invalid_supplier_storage_duration_days(
            default_days=fallback_storage_days,
            dealer_profile_id=dealer_profile_id,
        )

    qs = DealerInventoryBatch.objects.filter(deleted_at__isnull=True)
    if dealer_profile_id is not None:
        qs = qs.filter(dealer_product__dealer_profile_id=dealer_profile_id)
    if only_null and not recompute:
        qs = qs.filter(expiry_date__isnull=True)
    qs = qs.select_related("dealer_product__supplier_product")

    updated = 0
    skipped = 0
    skipped_batches = []
    for batch in qs.iterator():
        supplier_product = batch.dealer_product.supplier_product
        if supplier_product is None:
            skipped += 1
            skipped_batches.append(
                {"batch_id": batch.id, "reason": "Không liên kết sản phẩm NCC"}
            )
            continue
        expiry_date = compute_batch_expiry_date(
            batch.import_date,
            supplier_product,
            fallback_days=fallback_storage_days,
        )
        if expiry_date is None:
            skipped += 1
            raw_days = getattr(supplier_product, "storage_duration_days", None)
            skipped_batches.append(
                {
                    "batch_id": batch.id,
                    "supplier_product_id": supplier_product.id,
                    "storage_duration_days": raw_days,
                    "reason": (
                        "storage_duration_days không hợp lệ hoặc chưa cấu hình — "
                        "truyền default_storage_days (vd. 7) khi backfill"
                    ),
                }
            )
            continue
        if dry_run:
            updated += 1
            continue
        set_batch_expiry_date(batch, expiry_date)
        updated += 1
    return {
        "updated": updated,
        "skipped": skipped,
        "fixed_supplier_products": fixed_supplier_products,
        "skipped_batches": skipped_batches,
    }


def mark_expired_inventory_batches(*, dealer_profile_id=None) -> int:
    """Đánh dấu lô ACTIVE đã quá expiry_date → status=expired."""
    today = timezone.localdate()
    qs = DealerInventoryBatch.objects.filter(
        status=DealerInventoryBatchStatus.ACTIVE,
        expiry_date__isnull=False,
        expiry_date__lt=today,
        deleted_at__isnull=True,
    )
    if dealer_profile_id is not None:
        qs = qs.filter(dealer_product__dealer_profile_id=dealer_profile_id)
    return qs.update(
        status=DealerInventoryBatchStatus.EXPIRED,
        updated_at=timezone.now(),
    )

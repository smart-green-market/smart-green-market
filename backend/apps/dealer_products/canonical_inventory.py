"""Một sản phẩm đại lý / tên — một lô MAIN tồn kho."""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerProduct,
    DealerProductStatus,
)

CANONICAL_BATCH_NUMBER = "MAIN"

_TITLE_SUFFIXES = (" — bán lẻ", " - bán lẻ")


def normalize_dealer_product_title(title: str) -> str:
    """Chuẩn hóa tên để gộp SP trùng (bỏ hậu tố seed, không phân biệt hoa thường)."""
    normalized = (title or "").strip()
    for suffix in _TITLE_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
    return normalized.casefold()


def display_title_from_supplier_name(name: str) -> str:
    return (name or "").strip()


def strip_title_suffix(title: str) -> str:
    normalized = (title or "").strip()
    for suffix in _TITLE_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
    return normalized


def find_canonical_dealer_product(dealer_profile, title: str):
    """Tìm SP đại lý theo tên đã chuẩn hóa (bỏ qua bản đã xóa)."""
    key = normalize_dealer_product_title(title)
    if not key:
        return None
    for product in (
        DealerProduct.objects.filter(dealer_profile=dealer_profile)
        .exclude(status=DealerProductStatus.DELETED)
        .order_by("id")
    ):
        if normalize_dealer_product_title(product.title) == key:
            return product
    return None


def get_or_create_canonical_dealer_product(
    dealer_profile,
    *,
    supplier_product,
    retail_price=None,
    category=None,
):
    """Lấy hoặc tạo đúng một SP đại lý cho mỗi tên sản phẩm."""
    title = display_title_from_supplier_name(supplier_product.name)
    existing = find_canonical_dealer_product(dealer_profile, title)
    if existing:
        return existing, False

    if retail_price is None:
        retail_price = supplier_product.wholesale_price

    product = DealerProduct.objects.create(
        dealer_profile=dealer_profile,
        supplier_product=supplier_product,
        title=title,
        retail_price=retail_price,
        category=category,
        status=DealerProductStatus.ACTIVE,
    )
    return product, True


def get_or_create_main_batch(dealer_product, *, for_update=False):
    """Lô MAIN duy nhất — tạo với tồn 0 nếu chưa có."""
    qs = DealerInventoryBatch.objects.filter(
        dealer_product=dealer_product,
        batch_number=CANONICAL_BATCH_NUMBER,
        deleted_at__isnull=True,
    )
    if for_update:
        qs = qs.select_for_update()
    batch = qs.first()
    if batch:
        return batch, False

    today = timezone.localdate()
    batch = DealerInventoryBatch.objects.create(
        dealer_product=dealer_product,
        batch_number=CANONICAL_BATCH_NUMBER,
        quantity=0,
        remaining_quantity=0,
        import_price=Decimal("0"),
        import_date=today,
        status=DealerInventoryBatchStatus.ACTIVE,
    )
    return batch, True


@transaction.atomic
def add_import_to_main_batch(
    *,
    dealer_product,
    quantity: int,
    import_price,
    reason: str,
    user,
    import_date=None,
):
    """Cộng dồn số lượng nhập vào lô MAIN và ghi transaction IMPORT."""
    if quantity <= 0:
        return None

    batch, _ = get_or_create_main_batch(dealer_product, for_update=True)
    import_date = import_date or timezone.localdate()
    qty_before = batch.remaining_quantity

    batch.quantity += quantity
    batch.remaining_quantity += quantity
    batch.import_price = import_price
    batch.import_date = import_date
    if batch.status in (
        DealerInventoryBatchStatus.DEPLETED,
        DealerInventoryBatchStatus.EXPIRED,
    ):
        batch.status = DealerInventoryBatchStatus.ACTIVE
    batch.save(
        update_fields=[
            "quantity",
            "remaining_quantity",
            "import_price",
            "import_date",
            "status",
            "updated_at",
        ]
    )

    DealerInventoryTransaction.objects.create(
        batch=batch,
        type=DealerInventoryTransactionType.IMPORT,
        quantity_before=qty_before,
        quantity_change=quantity,
        quantity_after=batch.remaining_quantity,
        reason=reason,
        created_by=user,
    )
    return batch

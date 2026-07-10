"""Một SP đại lý / product catalog — một lô MAIN tồn kho."""

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
    """Chuẩn hóa tên fallback khi SP không gắn product catalog."""
    normalized = (title or "").strip()
    for suffix in _TITLE_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
    return normalized.casefold()


def strip_title_suffix(title: str) -> str:
    normalized = (title or "").strip()
    for suffix in _TITLE_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
    return normalized


def resolve_product_master_id(*, supplier_product=None, product_master_id=None) -> int | None:
    if product_master_id:
        return int(product_master_id)
    if supplier_product is not None and supplier_product.product_master_id:
        return int(supplier_product.product_master_id)
    return None


def resolve_canonical_title(*, supplier_product) -> str:
    """Tên bán lẻ ưu tiên catalog chuẩn, không phụ thuộc tên NCC."""
    master = getattr(supplier_product, "product_master", None)
    if master is not None and master.name:
        return master.name.strip()
    return (supplier_product.name or "").strip()


def find_canonical_dealer_product(
    dealer_profile,
    *,
    supplier_product=None,
    product_master_id=None,
    title=None,
):
    """Tìm SP đại lý theo product_master (ưu tiên) hoặc tên chuẩn hóa."""
    master_id = resolve_product_master_id(
        supplier_product=supplier_product,
        product_master_id=product_master_id,
    )
    base_qs = DealerProduct.objects.filter(dealer_profile=dealer_profile).exclude(
        status=DealerProductStatus.DELETED
    )

    if master_id:
        product = (
            base_qs.filter(product_master_id=master_id).order_by("id").first()
        )
        if product:
            return product
        product = (
            base_qs.filter(
                product_master__isnull=True,
                supplier_product__product_master_id=master_id,
            )
            .select_related("supplier_product")
            .order_by("id")
            .first()
        )
        if product:
            return product

    lookup_title = title
    if supplier_product is not None and not lookup_title:
        lookup_title = supplier_product.name
    key = normalize_dealer_product_title(lookup_title or "")
    if not key:
        return None

    for product in base_qs.select_related("supplier_product").order_by("id"):
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
    """Lấy hoặc tạo đúng một SP đại lý cho mỗi product catalog (hoặc tên fallback)."""
    master_id = resolve_product_master_id(supplier_product=supplier_product)
    existing = find_canonical_dealer_product(
        dealer_profile,
        supplier_product=supplier_product,
        product_master_id=master_id,
    )
    if existing:
        updates = []
        if master_id and existing.product_master_id != master_id:
            existing.product_master_id = master_id
            updates.append("product_master")
        canonical_title = resolve_canonical_title(supplier_product=supplier_product)
        if canonical_title and existing.title != canonical_title:
            existing.title = canonical_title
            updates.append("title")
        if updates:
            updates.append("updated_at")
            existing.save(update_fields=updates)
        return existing, False

    if retail_price is None:
        retail_price = supplier_product.wholesale_price

    product = DealerProduct.objects.create(
        dealer_profile=dealer_profile,
        supplier_product=supplier_product,
        product_master_id=master_id,
        title=resolve_canonical_title(supplier_product=supplier_product),
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

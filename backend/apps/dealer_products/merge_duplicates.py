"""Gộp sản phẩm đại lý trùng tên và hợp nhất tồn vào lô MAIN."""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.dealer_products.canonical_inventory import (
    CANONICAL_BATCH_NUMBER,
    get_or_create_main_batch,
    normalize_dealer_product_title,
    strip_title_suffix,
)
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerProduct,
    DealerProductImage,
    DealerProductRelatedRecommendation,
    DealerProductStatus,
)
from apps.dealer_products.models_age_discount import AgeDiscountPolicy
from apps.marketing.models import CustomerInteraction
from apps.orders.models import OrderItem, PreOrderRequestItem
from apps.promotions.models import PromotionTarget
from apps.reviews.models import ProductRecommendation, ProductReview


def _product_stock(product_id: int) -> int:
    total = (
        DealerInventoryBatch.objects.filter(
            dealer_product_id=product_id,
            deleted_at__isnull=True,
        ).aggregate(total=Sum("remaining_quantity"))["total"]
        or 0
    )
    return int(total)


def _pick_canonical_product(products: list[DealerProduct]) -> DealerProduct:
    """Ưu tiên: đang bán > tồn cao > id nhỏ (tạo sớm)."""
    return max(
        products,
        key=lambda p: (
            1 if p.status == DealerProductStatus.ACTIVE else 0,
            _product_stock(p.id),
            -p.id,
        ),
    )


def _merge_customer_interactions(canonical_id: int, duplicate_ids: list[int]) -> None:
    dup_rows = list(
        CustomerInteraction.objects.filter(dealer_product_id__in=duplicate_ids)
    )
    for row in dup_rows:
        existing = CustomerInteraction.objects.filter(
            customer_id=row.customer_id,
            dealer_product_id=canonical_id,
        ).first()
        if existing:
            existing.view_count += row.view_count
            existing.add_cart_count += row.add_cart_count
            existing.purchase_count += row.purchase_count
            for field in ("last_viewed_at", "last_added_at", "last_purchased_at"):
                old = getattr(existing, field)
                new = getattr(row, field)
                if new and (old is None or new > old):
                    setattr(existing, field, new)
            existing.save()
            row.delete()
        else:
            row.dealer_product_id = canonical_id
            row.save(update_fields=["dealer_product_id", "updated_at"])


def _merge_related_recommendations(canonical_id: int, duplicate_ids: list[int]) -> None:
    id_map = {dup_id: canonical_id for dup_id in duplicate_ids}
    rec = DealerProductRelatedRecommendation.objects.filter(
        dealer_product_id=canonical_id
    ).first()
    for dup_rec in DealerProductRelatedRecommendation.objects.filter(
        dealer_product_id__in=duplicate_ids
    ):
        if rec is None:
            dup_rec.dealer_product_id = canonical_id
            dup_rec.save(update_fields=["dealer_product_id", "updated_at"])
            rec = dup_rec
            continue
        merged_ids = []
        seen = set()
        for raw_id in list(rec.related_product_ids) + list(dup_rec.related_product_ids):
            mapped = id_map.get(raw_id, raw_id)
            if mapped == canonical_id or mapped in seen:
                continue
            seen.add(mapped)
            merged_ids.append(mapped)
        rec.related_product_ids = merged_ids
        rec.save(update_fields=["related_product_ids", "updated_at"])
        dup_rec.delete()


def _repoint_simple_fk(model, field_name: str, canonical_id: int, duplicate_ids: list[int]) -> None:
    model.objects.filter(**{f"{field_name}__in": duplicate_ids}).update(
        **{field_name: canonical_id}
    )


def _transfer_product_batches_to_canonical_main(canonical, source_product, *, user=None) -> int:
    """Chuyển toàn bộ tồn từ mọi lô của source sang lô MAIN của canonical."""
    if source_product.id == canonical.id:
        return 0

    main_batch, _ = get_or_create_main_batch(canonical, for_update=True)
    source_batches = DealerInventoryBatch.objects.filter(
        dealer_product=source_product,
        deleted_at__isnull=True,
    ).select_for_update()

    extra_remaining = 0
    for batch in source_batches:
        if batch.remaining_quantity <= 0:
            batch.deleted_at = timezone.now()
            batch.save(update_fields=["deleted_at", "updated_at"])
            continue
        extra_remaining += batch.remaining_quantity
        batch.remaining_quantity = 0
        batch.status = DealerInventoryBatchStatus.DEPLETED
        batch.deleted_at = timezone.now()
        batch.save(
            update_fields=[
                "remaining_quantity",
                "status",
                "deleted_at",
                "updated_at",
            ]
        )

    if extra_remaining <= 0:
        return 0

    qty_before = main_batch.remaining_quantity
    main_batch.quantity += extra_remaining
    main_batch.remaining_quantity += extra_remaining
    if main_batch.status != DealerInventoryBatchStatus.ACTIVE:
        main_batch.status = DealerInventoryBatchStatus.ACTIVE
    main_batch.save(
        update_fields=[
            "quantity",
            "remaining_quantity",
            "status",
            "updated_at",
        ]
    )
    DealerInventoryTransaction.objects.create(
        batch=main_batch,
        type=DealerInventoryTransactionType.ADJUSTMENT,
        quantity_before=qty_before,
        quantity_change=extra_remaining,
        quantity_after=main_batch.remaining_quantity,
        reason=f"Gộp tồn từ SP #{source_product.id} ({source_product.title})",
        created_by=user,
    )
    return extra_remaining


@transaction.atomic
def merge_inventory_into_main_batch(dealer_product: DealerProduct, *, user=None) -> DealerInventoryBatch:
    """Gộp mọi lô còn tồn của SP vào lô MAIN; lô cũ soft-delete nếu không còn tồn."""
    main_batch, _ = get_or_create_main_batch(dealer_product, for_update=True)
    other_batches = (
        DealerInventoryBatch.objects.filter(
            dealer_product=dealer_product,
            deleted_at__isnull=True,
        )
        .exclude(batch_number=CANONICAL_BATCH_NUMBER)
        .select_for_update()
    )

    extra_remaining = 0
    extra_imported = 0
    for batch in other_batches:
        extra_remaining += batch.remaining_quantity
        extra_imported += batch.quantity
        if batch.remaining_quantity == 0:
            batch.deleted_at = timezone.now()
            batch.save(update_fields=["deleted_at", "updated_at"])

    if extra_remaining > 0 or extra_imported > 0:
        qty_before = main_batch.remaining_quantity
        main_batch.quantity += extra_imported
        main_batch.remaining_quantity += extra_remaining
        if main_batch.status != DealerInventoryBatchStatus.ACTIVE:
            main_batch.status = DealerInventoryBatchStatus.ACTIVE
        main_batch.save(
            update_fields=[
                "quantity",
                "remaining_quantity",
                "status",
                "updated_at",
            ]
        )
        DealerInventoryTransaction.objects.create(
            batch=main_batch,
            type=DealerInventoryTransactionType.ADJUSTMENT,
            quantity_before=qty_before,
            quantity_change=extra_remaining,
            quantity_after=main_batch.remaining_quantity,
            reason="Gộp tồn các lô cũ vào lô MAIN",
            created_by=user,
        )

        for batch in other_batches.filter(remaining_quantity__gt=0):
            batch.remaining_quantity = 0
            batch.status = DealerInventoryBatchStatus.DEPLETED
            batch.deleted_at = timezone.now()
            batch.save(
                update_fields=[
                    "remaining_quantity",
                    "status",
                    "deleted_at",
                    "updated_at",
                ]
            )

    return main_batch


@transaction.atomic
def merge_duplicate_dealer_products_for_dealer(dealer_profile, *, user=None) -> dict:
    """Gộp SP trùng tên của một đại lý. Trả về thống kê."""
    products = list(
        DealerProduct.objects.filter(dealer_profile=dealer_profile)
        .exclude(status=DealerProductStatus.DELETED)
        .order_by("id")
    )
    groups: dict[str, list[DealerProduct]] = defaultdict(list)
    for product in products:
        key = normalize_dealer_product_title(product.title)
        if key:
            groups[key].append(product)

    merged_groups = 0
    merged_products = 0
    for group in groups.values():
        if len(group) < 2:
            continue

        canonical = _pick_canonical_product(group)
        duplicates = [p for p in group if p.id != canonical.id]
        duplicate_ids = [p.id for p in duplicates]

        canonical.title = strip_title_suffix(canonical.title)

        _repoint_simple_fk(DealerProductImage, "dealer_product", canonical.id, duplicate_ids)
        _repoint_simple_fk(AgeDiscountPolicy, "dealer_product", canonical.id, duplicate_ids)
        _repoint_simple_fk(OrderItem, "dealer_product", canonical.id, duplicate_ids)
        _repoint_simple_fk(PreOrderRequestItem, "dealer_product", canonical.id, duplicate_ids)
        _repoint_simple_fk(PromotionTarget, "dealer_product", canonical.id, duplicate_ids)
        _repoint_simple_fk(ProductReview, "dealer_product", canonical.id, duplicate_ids)
        _repoint_simple_fk(
            ProductRecommendation,
            "dealer_product",
            canonical.id,
            duplicate_ids,
        )
        _merge_customer_interactions(canonical.id, duplicate_ids)
        _merge_related_recommendations(canonical.id, duplicate_ids)

        for dup in duplicates:
            _transfer_product_batches_to_canonical_main(canonical, dup, user=user)

        merge_inventory_into_main_batch(canonical, user=user)

        DealerProduct.objects.filter(id__in=duplicate_ids).update(
            status=DealerProductStatus.DELETED,
            updated_at=timezone.now(),
        )
        canonical.save(update_fields=["title", "updated_at"])

        merged_groups += 1
        merged_products += len(duplicate_ids)

    return {
        "merged_groups": merged_groups,
        "merged_products": merged_products,
    }


@transaction.atomic
def merge_all_duplicate_dealer_products(*, user=None) -> dict:
    """Gộp SP trùng tên cho mọi đại lý."""
    from apps.dealers.models import DealerProfile

    totals = {"dealers": 0, "merged_groups": 0, "merged_products": 0}
    for dealer in DealerProfile.objects.all().order_by("id"):
        result = merge_duplicate_dealer_products_for_dealer(dealer, user=user)
        if result["merged_groups"]:
            totals["dealers"] += 1
        totals["merged_groups"] += result["merged_groups"]
        totals["merged_products"] += result["merged_products"]
    return totals


def consolidate_orphan_batches_for_dealer(dealer_profile, *, user=None) -> int:
    """Đảm bảo mỗi SP chỉ còn lô MAIN mang tồn (SP không trùng tên)."""
    count = 0
    for product in DealerProduct.objects.filter(dealer_profile=dealer_profile).exclude(
        status=DealerProductStatus.DELETED
    ):
        before = DealerInventoryBatch.objects.filter(
            dealer_product=product,
            deleted_at__isnull=True,
            remaining_quantity__gt=0,
        ).exclude(batch_number=CANONICAL_BATCH_NUMBER).count()
        if before:
            merge_inventory_into_main_batch(product, user=user)
            count += 1
    return count

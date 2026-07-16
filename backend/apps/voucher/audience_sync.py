"""Đồng bộ audience và product scope cho voucher."""

from apps.promotions.models import (
    PRODUCT_TARGET_TYPES,
    Promotion,
    PromotionTarget,
    PromotionTargetType,
    VoucherAudienceType,
)


def sync_promotion_audience(
    promotion: Promotion,
    *,
    audience_type: str,
    loyalty_tier_ids=None,
    customer_segment_ids=None,
):
    """Cập nhật audience — không đụng product/category targets."""
    loyalty_tier_ids = loyalty_tier_ids or []
    customer_segment_ids = customer_segment_ids or []

    promotion.targets.filter(target_type=PromotionTargetType.SEGMENT).delete()

    if audience_type == VoucherAudienceType.ALL:
        promotion.loyalty_tiers.clear()
        return

    if audience_type == VoucherAudienceType.LOYALTY_TIER:
        promotion.loyalty_tiers.set(loyalty_tier_ids)
        return

    if audience_type == VoucherAudienceType.CUSTOMER_SEGMENT:
        promotion.loyalty_tiers.clear()
        for segment_id in customer_segment_ids:
            PromotionTarget.objects.create(
                promotion=promotion,
                target_type=PromotionTargetType.SEGMENT,
                segment_id=segment_id,
            )


def sync_promotion_product_targets(promotion: Promotion, product_targets_data):
    """Thay thế chỉ product/category targets."""
    promotion.targets.filter(target_type__in=PRODUCT_TARGET_TYPES).delete()
    for row in product_targets_data:
        PromotionTarget.objects.create(promotion=promotion, **row)


def extract_segment_ids_from_legacy_targets(targets_data):
    """Tương thích payload cũ: targets[] chứa segment."""
    segment_ids = []
    for row in targets_data or []:
        target_type = row.get("target_type")
        if target_type == PromotionTargetType.SEGMENT:
            segment = row.get("segment")
            if segment is not None:
                segment_ids.append(segment.id if hasattr(segment, "id") else segment)
    return segment_ids

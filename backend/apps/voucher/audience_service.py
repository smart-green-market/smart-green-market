"""Kiểm tra đối tượng khách hàng được sử dụng voucher."""

from rest_framework.exceptions import ValidationError

from apps.promotions.models import (
    Promotion,
    PromotionTargetType,
    VoucherAudienceType,
)


def promotion_dealer_matches_customer(promotion: Promotion, customer) -> bool:
    """Voucher dealer phải trùng storefront của buyer (platform voucher: dealer null)."""
    customer_dealer_id = customer.user.store_dealer_id
    if promotion.dealer_id is None:
        return True
    return customer_dealer_id == promotion.dealer_id


def customer_matches_voucher_audience(promotion: Promotion, customer) -> bool:
    """Khách có đủ điều kiện audience của voucher (không kiểm tra product scope)."""
    if not promotion_dealer_matches_customer(promotion, customer):
        return False

    legacy_customer_targets = promotion.targets.filter(
        target_type=PromotionTargetType.CUSTOMER,
    )
    if legacy_customer_targets.exists():
        return legacy_customer_targets.filter(customer=customer).exists()

    audience_type = promotion.audience_type or VoucherAudienceType.ALL

    if audience_type == VoucherAudienceType.ALL:
        return True

    if audience_type == VoucherAudienceType.LOYALTY_TIER:
        if customer.current_tier_id is None:
            return False
        return promotion.loyalty_tiers.filter(id=customer.current_tier_id).exists()

    if audience_type == VoucherAudienceType.CUSTOMER_SEGMENT:
        segment_ids = promotion.targets.filter(
            target_type=PromotionTargetType.SEGMENT,
        ).values_list("segment_id", flat=True)
        if not segment_ids:
            return False
        return customer.segment_memberships.filter(segment_id__in=segment_ids).exists()

    return False


def validate_voucher_audience_for_customer(
    promotion: Promotion,
    customer,
    *,
    error_field="voucher_code",
):
    """Raise ValidationError nếu customer không đủ điều kiện audience."""
    if not promotion_dealer_matches_customer(promotion, customer):
        raise ValidationError({error_field: ["Mã giảm giá không thuộc cửa hàng này."]})

    legacy_customer_targets = promotion.targets.filter(
        target_type=PromotionTargetType.CUSTOMER,
    )
    if legacy_customer_targets.exists():
        if not legacy_customer_targets.filter(customer=customer).exists():
            raise ValidationError(
                {error_field: ["Mã giảm giá này không áp dụng cho tài khoản của bạn."]}
            )
        return

    audience_type = promotion.audience_type or VoucherAudienceType.ALL

    if audience_type == VoucherAudienceType.LOYALTY_TIER:
        if not customer_matches_voucher_audience(promotion, customer):
            raise ValidationError(
                {
                    error_field: [
                        "Hạng thành viên hiện tại không đủ điều kiện sử dụng mã giảm giá này."
                    ]
                }
            )
        return

    if audience_type == VoucherAudienceType.CUSTOMER_SEGMENT:
        if not customer_matches_voucher_audience(promotion, customer):
            raise ValidationError(
                {
                    error_field: [
                        "Mã giảm giá này không áp dụng cho tài khoản của bạn."
                    ]
                }
            )
        return

    if audience_type == VoucherAudienceType.ALL:
        return

    raise ValidationError({error_field: ["Mã giảm giá này không áp dụng cho tài khoản của bạn."]})


def filter_promotions_matching_audience(promotions, customer):
    """Lọc queryset/list promotion theo audience (sau filter trạng thái/dealer)."""
    if hasattr(promotions, "prefetch_related"):
        promotions = promotions.prefetch_related("targets", "loyalty_tiers")

    matched_ids = []
    for promotion in promotions:
        if customer_matches_voucher_audience(promotion, customer):
            matched_ids.append(promotion.id)

    return promotions.filter(id__in=matched_ids) if hasattr(promotions, "filter") else [
        p for p in promotions if p.id in matched_ids
    ]

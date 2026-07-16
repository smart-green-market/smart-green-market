"""Validation audience khi tạo/cập nhật voucher."""

from rest_framework import serializers

from apps.loyalty.models import LoyaltyTier
from apps.marketing.models import CustomerSegment
from apps.promotions.models import VoucherAudienceType


def validate_loyalty_tier_ids(dealer, tier_ids):
    if not tier_ids:
        raise serializers.ValidationError(
            {"loyalty_tier_ids": ["Vui lòng chọn ít nhất một hạng thành viên."]}
        )
    unique_ids = list(dict.fromkeys(tier_ids))
    if len(unique_ids) != len(tier_ids):
        raise serializers.ValidationError(
            {"loyalty_tier_ids": ["Không được chọn trùng hạng thành viên."]}
        )

    if dealer is None:
        raise serializers.ValidationError(
            {"loyalty_tier_ids": ["Voucher toàn sàn không thể gắn hạng thành viên của đại lý."]}
        )

    tiers = LoyaltyTier.objects.filter(id__in=unique_ids)
    if tiers.count() != len(unique_ids):
        raise serializers.ValidationError(
            {"loyalty_tier_ids": ["Một hoặc nhiều hạng thành viên không tồn tại."]}
        )

    invalid = tiers.exclude(dealer=dealer)
    if invalid.exists():
        raise serializers.ValidationError(
            {"loyalty_tier_ids": ["Hạng thành viên không thuộc đại lý hiện tại."]}
        )
    return unique_ids


def validate_customer_segment_ids(segment_ids):
    if not segment_ids:
        raise serializers.ValidationError(
            {"customer_segment_ids": ["Vui lòng chọn ít nhất một phân khúc khách hàng."]}
        )
    unique_ids = list(dict.fromkeys(segment_ids))
    if len(unique_ids) != len(segment_ids):
        raise serializers.ValidationError(
            {"customer_segment_ids": ["Không được chọn trùng phân khúc."]}
        )

    segments = CustomerSegment.objects.filter(id__in=unique_ids)
    if segments.count() != len(unique_ids):
        raise serializers.ValidationError(
            {"customer_segment_ids": ["Một hoặc nhiều phân khúc không tồn tại."]}
        )
    return unique_ids


def validate_audience_payload(
    *,
    audience_type,
    loyalty_tier_ids,
    customer_segment_ids,
    dealer,
    reject_customer_target=False,
):
    if reject_customer_target:
        raise serializers.ValidationError(
            {"product_targets": ["Không hỗ trợ tạo voucher theo một khách hàng cụ thể."]}
        )

    if audience_type == VoucherAudienceType.ALL:
        return [], []

    if audience_type == VoucherAudienceType.LOYALTY_TIER:
        tier_ids = validate_loyalty_tier_ids(dealer, loyalty_tier_ids or [])
        return tier_ids, []

    if audience_type == VoucherAudienceType.CUSTOMER_SEGMENT:
        segment_ids = validate_customer_segment_ids(customer_segment_ids or [])
        return [], segment_ids

    raise serializers.ValidationError(
        {"audience_type": ["Loại đối tượng áp dụng không hợp lệ."]}
    )

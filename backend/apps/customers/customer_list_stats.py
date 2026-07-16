"""Thống kê danh sách khách hàng theo hạng loyalty và phân khúc."""

from django.db.models import Count

from apps.marketing.models import CustomerSegment, CustomerSegmentMember
from apps.marketing.segment_defaults import SEGMENT_PRIORITY, resolve_primary_segment_membership


def filter_by_primary_segment_code(queryset, segment_code):
    """Lọc khách có phân khúc chính (primary) khớp mã segment."""
    if not segment_code:
        return queryset
    code = segment_code.strip().upper()
    priority = SEGMENT_PRIORITY.get(code, 0)
    higher_codes = [item for item, value in SEGMENT_PRIORITY.items() if value > priority]
    qs = queryset.filter(segment_memberships__segment__code=code)
    if higher_codes:
        qs = qs.exclude(segment_memberships__segment__code__in=higher_codes)
    return qs.distinct()


def build_count_loyalty(queryset):
    """
    Đếm khách theo mã hạng thành viên (current_tier.code).
    Khách chưa có hạng → key `_none`.
    """
    counts = {"_none": 0}
    for row in (
        queryset.order_by()
        .values("current_tier__code")
        .annotate(_count=Count("id"))
    ):
        code = row["current_tier__code"]
        if code is None:
            counts["_none"] = row["_count"]
        else:
            counts[code] = row["_count"]
    return counts


def build_count_segment(queryset):
    """
    Đếm khách theo phân khúc chính (primary segment).
    Khách chưa có segment → key `_none`.
    """
    profile_ids = list(queryset.values_list("id", flat=True))
    counts = {code: 0 for code in CustomerSegment.objects.values_list("code", flat=True)}
    counts["_none"] = 0
    if not profile_ids:
        return counts

    memberships_by_profile = {}
    for membership in (
        CustomerSegmentMember.objects.filter(customer_profile_id__in=profile_ids)
        .select_related("segment")
        .order_by("customer_profile_id", "-created_at")
    ):
        memberships_by_profile.setdefault(membership.customer_profile_id, []).append(
            membership
        )

    for profile_id in profile_ids:
        primary = resolve_primary_segment_membership(
            memberships_by_profile.get(profile_id, [])
        )
        if primary is None:
            counts["_none"] += 1
        else:
            code = primary.segment.code
            counts[code] = counts.get(code, 0) + 1
    return counts

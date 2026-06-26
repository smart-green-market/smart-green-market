"""Đếm số bản ghi theo trạng thái — dùng cho tab filter trên UI danh sách."""

from django.db.models import Count


def build_count_status(queryset, *, field, choices):
    """
    Trả dict {status_value: count} — mọi choice có mặt (thiếu = 0).
    Tính trên queryset đã scope + search, chưa lọc status tab hiện tại.
    """
    counts = {choice.value: 0 for choice in choices}
    pk_name = queryset.model._meta.pk.name
    # Xóa order_by / annotate ưu tiên pending — nếu không Django GROUP BY thêm
    # _pending_priority + pk → mỗi dòng count=1, dict ghi đè còn 1/status.
    for row in (
        queryset.order_by()
        .values(field)
        .annotate(_count=Count(pk_name, distinct=True))
    ):
        key = row[field]
        if key is None:
            continue
        counts[key] = row["_count"]
    return counts


def filter_by_status_param(queryset, status_param, *, field):
    """Áp filter ?status= nếu có."""
    if not status_param:
        return queryset
    value = status_param.strip() if isinstance(status_param, str) else status_param
    if not value:
        return queryset
    return queryset.filter(**{field: value})


def normalize_supplier_verification_status(status_param):
    """Map alias UI `active` → giá trị DB `approved`."""
    if not status_param:
        return None
    value = status_param.strip()
    if value == "active":
        return "approved"
    return value

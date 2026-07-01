"""Helper Product Master và Season."""

from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from apps.accounts.models import AccountRole
from apps.categories.models import CategoryStatus
from apps.categories.utils import is_system_category

from .models import ProductMaster, ProductMasterStatus, Season, SeasonStatus


def ensure_system_category(category, *, field="category"):
    if not is_system_category(category):
        raise ValidationError({field: "Product Master chỉ gắn danh mục hệ thống (scope=system)."})
    if category.status != CategoryStatus.ACTIVE:
        raise ValidationError({field: "Danh mục hệ thống chưa active."})


def validate_month(value: int, *, field: str) -> int:
    if value < 1 or value > 12:
        raise ValidationError({field: "Tháng phải từ 1 đến 12."})
    return value


def season_includes_month(*, start_month: int, end_month: int, month: int) -> bool:
    """Kiểm tra tháng có nằm trong khoảng mùa (hỗ trợ qua năm, vd. 11–2)."""
    if start_month <= end_month:
        return start_month <= month <= end_month
    return month >= start_month or month <= end_month


def season_ids_for_month(month: int) -> list[int]:
    return [
        season.id
        for season in Season.objects.filter(status=SeasonStatus.ACTIVE)
        if season_includes_month(
            start_month=season.start_month,
            end_month=season.end_month,
            month=month,
        )
    ]


def parse_optional_category_id(raw) -> int | None:
    if raw is None:
        return None
    value = str(raw).strip()
    if not value:
        return None
    try:
        category_id = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({"category_id": "category_id phải là số nguyên."}) from exc
    if category_id < 1:
        raise ValidationError({"category_id": "category_id phải >= 1."})
    return category_id


def parse_optional_season_id(raw) -> int | None:
    if raw is None:
        return None
    value = str(raw).strip()
    if not value:
        return None
    try:
        season_id = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({"season_id": "season_id phải là số nguyên."}) from exc
    if season_id < 1:
        raise ValidationError({"season_id": "season_id phải >= 1."})
    return season_id


def parse_bool_query(raw) -> bool:
    if raw is None:
        return False
    return str(raw).strip().lower() in {"1", "true", "yes"}


def apply_product_master_list_filters(
    qs,
    *,
    user,
    category_id_raw=None,
    season_id_raw=None,
    current_season_raw=None,
    current_month=None,
):
    category_id = parse_optional_category_id(category_id_raw)
    if category_id is not None:
        qs = qs.filter(category_id=category_id)

    need_distinct = False
    season_id = parse_optional_season_id(season_id_raw)
    if season_id is not None:
        qs = qs.filter(seasons__id=season_id)
        need_distinct = True

    if parse_bool_query(current_season_raw):
        month = current_month or timezone.localdate().month
        active_season_ids = season_ids_for_month(month)
        if not active_season_ids:
            return qs.none()
        qs = qs.filter(seasons__id__in=active_season_ids)
        need_distinct = True

    if getattr(user, "role", None) != AccountRole.ADMIN:
        qs = qs.filter(
            status=ProductMasterStatus.ACTIVE,
            category__status=CategoryStatus.ACTIVE,
        )
    return qs.distinct() if need_distinct else qs


def generate_unique_master_slug(category, name, *, exclude_pk=None):
    base = slugify(name) or "product"
    slug = base
    suffix = 1
    qs = ProductMaster.objects.filter(category=category, slug=slug)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.exists():
        suffix += 1
        slug = f"{base}-{suffix}"
        qs = ProductMaster.objects.filter(category=category, slug=slug)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
    return slug

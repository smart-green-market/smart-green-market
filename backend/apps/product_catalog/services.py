"""Helper Product Master."""

from django.db.models import Q
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from apps.accounts.models import AccountRole
from apps.categories.models import CategoryStatus
from apps.categories.utils import is_system_category

from .models import ProductMaster, ProductMasterStatus


def ensure_system_category(category, *, field="category"):
    if not is_system_category(category):
        raise ValidationError({field: "Product Master chỉ gắn danh mục hệ thống (scope=system)."})
    if category.status != CategoryStatus.ACTIVE:
        raise ValidationError({field: "Danh mục hệ thống chưa active."})


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


def apply_product_master_list_filters(
    qs,
    *,
    user,
    category_id_raw=None,
    search=None,
    status_param=None,
):
    category_id = parse_optional_category_id(category_id_raw)
    if category_id is not None:
        qs = qs.filter(category_id=category_id)

    if search:
        search = search.strip()
        qs = qs.filter(
            Q(name__icontains=search)
            | Q(category__name__icontains=search)
            | Q(default_unit__icontains=search)
        )

    if getattr(user, "role", None) != AccountRole.ADMIN:
        if status_param and status_param != ProductMasterStatus.ACTIVE:
            qs = qs.none()
        else:
            qs = qs.filter(
                status=ProductMasterStatus.ACTIVE,
                category__status=CategoryStatus.ACTIVE,
            )
    else:
        if status_param:
            qs = qs.filter(status=status_param)
    return qs


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

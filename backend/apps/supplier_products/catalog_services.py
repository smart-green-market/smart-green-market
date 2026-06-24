"""Nghiệp vụ catalog — 2 trường hợp tạo SupplierProduct."""

from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from apps.categories.models import CategoryScope
from apps.categories.utils import category_assignable_by_user, is_system_category
from apps.product_catalog.models import ProductMaster, ProductMasterStatus


def generate_supplier_product_slug(supplier, name, *, exclude_pk=None):
    from .models import SupplierProduct

    base = slugify(name) or "product"
    slug = base
    suffix = 1
    qs = SupplierProduct.objects.filter(supplier=supplier, slug=slug)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.exists():
        suffix += 1
        slug = f"{base}-{suffix}"
        qs = SupplierProduct.objects.filter(supplier=supplier, slug=slug)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
    return slug


def _ensure_unique_master_link(supplier, product_master, *, exclude_pk=None):
    from .models import SupplierProduct

    if product_master is None:
        return
    qs = SupplierProduct.objects.filter(supplier=supplier, product_master=product_master)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    if qs.exists():
        raise ValidationError(
            {
                "product_master": (
                    "NCC đã có sản phẩm liên kết Product Master này. "
                    "Mỗi catalog chuẩn chỉ một listing/NCC."
                )
            }
        )


def apply_supplier_product_catalog_rules(
    *,
    user,
    category,
    product_master,
    name,
    unit,
    supplier,
    instance=None,
):
    """
    Trường hợp 1 — danh mục system: product_master bắt buộc, name/unit từ master.
    Trường hợp 2 — danh mục custom: name bắt buộc, product_master tuỳ chọn.
    """
    if not category_assignable_by_user(user, category):
        raise ValidationError({"category": "Danh mục không hợp lệ hoặc chưa được duyệt."})

    exclude_pk = instance.pk if instance else None

    if is_system_category(category):
        if product_master is None:
            raise ValidationError(
                {"product_master": "Danh mục hệ thống — bắt buộc chọn Product Master."}
            )
        if product_master.status != ProductMasterStatus.ACTIVE:
            raise ValidationError({"product_master": "Product Master chưa active."})
        if product_master.category_id != category.id:
            raise ValidationError(
                {"product_master": "Product Master không thuộc danh mục đã chọn."}
            )
        _ensure_unique_master_link(supplier, product_master, exclude_pk=exclude_pk)
        resolved_name = product_master.name
        resolved_unit = product_master.default_unit
        slug = generate_supplier_product_slug(
            supplier,
            resolved_name,
            exclude_pk=exclude_pk,
        )
        return {
            "category": category,
            "product_master": product_master,
            "name": resolved_name,
            "unit": resolved_unit,
            "slug": slug,
        }

    # Custom category
    if not (name or "").strip():
        raise ValidationError({"name": "Danh mục riêng — bắt buộc nhập tên sản phẩm."})
    if not (unit or "").strip():
        raise ValidationError({"unit": "Bắt buộc đơn vị bán (kg, bó...)."})
    if product_master is not None:
        if product_master.status != ProductMasterStatus.ACTIVE:
            raise ValidationError({"product_master": "Product Master chưa active."})
        _ensure_unique_master_link(supplier, product_master, exclude_pk=exclude_pk)

    resolved_name = name.strip()
    resolved_unit = unit.strip()
    slug = generate_supplier_product_slug(supplier, resolved_name, exclude_pk=exclude_pk)
    return {
        "category": category,
        "product_master": product_master,
        "name": resolved_name,
        "unit": resolved_unit,
        "slug": slug,
    }

"""Soft-delete danh mục."""

from django.db import transaction

from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.product_catalog.models import ProductMaster, ProductMasterStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from common.soft_delete import soft_delete_blocked

from .models import Category, CategoryStatus


def _linked_supplier_product_count(category) -> int:
    return SupplierProduct.objects.filter(category=category).exclude(
        status=SupplierProductStatus.DELETED,
    ).count()


def _linked_dealer_product_count(category) -> int:
    return DealerProduct.objects.filter(category=category).exclude(
        status=DealerProductStatus.DELETED,
    ).count()


def _linked_product_master_count(category) -> int:
    return ProductMaster.objects.filter(category=category).exclude(
        status=ProductMasterStatus.INACTIVE,
    ).count()


@transaction.atomic
def soft_delete_category(category: Category, user):
    """Ẩn danh mục (status=deleted) khi không còn sản phẩm/master gắn."""
    if category.status == CategoryStatus.DELETED:
        return category

    supplier_count = _linked_supplier_product_count(category)
    dealer_count = _linked_dealer_product_count(category)
    master_count = _linked_product_master_count(category)

    if supplier_count or dealer_count or master_count:
        soft_delete_blocked(
            code="has_linked_products",
            detail=(
                "Không thể xóa danh mục vì vẫn còn sản phẩm hoặc sản phẩm chuẩn đang sử dụng. "
                "Chuyển hoặc xóa sản phẩm liên quan trước."
            ),
            supplier_products=supplier_count,
            dealer_products=dealer_count,
            product_masters=master_count,
        )

    category.status = CategoryStatus.DELETED
    category.save(update_fields=["status", "updated_at"])
    return category

"""Query catalog sản phẩm gian hàng đại lý cho buyer."""

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.models import (
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)


def _storefront_active_product_count_filter(dealer):
    return Q(
        dealer_store_products__dealer_profile=dealer,
        dealer_store_products__status=DealerProductStatus.ACTIVE,
    )


def get_storefront_categories_qs(dealer):
    """Tất cả danh mục active của cửa hàng (system + custom dealer), kèm product_count."""
    return (
        Category.objects.filter(status=CategoryStatus.ACTIVE)
        .filter(
            Q(scope=CategoryScope.SYSTEM)
            | Q(created_by=dealer.account, scope=CategoryScope.CUSTOM)
        )
        .annotate(
            product_count=Count(
                "dealer_store_products",
                filter=_storefront_active_product_count_filter(dealer),
            )
        )
        .order_by("sort_order", "name")
    )


def _active_batch_stock_filter():
    today = timezone.localdate()
    return Q(
        inventory_batches__status=DealerInventoryBatchStatus.ACTIVE,
        inventory_batches__remaining_quantity__gt=0,
        inventory_batches__deleted_at__isnull=True,
    ) & (
        Q(inventory_batches__expiry_date__isnull=True)
        | Q(inventory_batches__expiry_date__gte=today)
    )


def get_storefront_products_qs(dealer):
    """Sản phẩm active của đại lý kèm tồn khả dụng."""
    stock_filter = _active_batch_stock_filter()
    return (
        DealerProduct.objects.filter(
            dealer_profile=dealer,
            status=DealerProductStatus.ACTIVE,
        )
        .select_related(
            "supplier_product",
            "supplier_product__supplier",
            "category",
        )
        .prefetch_related("images")
        .annotate(
            available_quantity=Coalesce(
                Sum(
                    "inventory_batches__remaining_quantity",
                    filter=stock_filter,
                ),
                0,
            )
        )
        .order_by("-updated_at", "-created_at", "-id")
    )


def apply_storefront_product_filters(qs, query_params):
    """Lọc/tìm kiếm/sắp xếp danh sách sản phẩm storefront."""
    category_id = query_params.get("category")
    if category_id:
        qs = qs.filter(category_id=category_id)

    search = (query_params.get("search") or query_params.get("q") or "").strip()
    if search:
        qs = qs.filter(
            Q(title__icontains=search)
            | Q(description__icontains=search)
            | Q(supplier_product__name__icontains=search)
            | Q(category__name__icontains=search)
        )

    in_stock = query_params.get("in_stock")
    if in_stock is not None and str(in_stock).lower() in ("true", "1", "yes"):
        qs = qs.filter(available_quantity__gt=0)

    ordering = query_params.get("ordering", "-updated_at")
    allowed_orderings = {
        "price": "retail_price",
        "-price": "-retail_price",
        "name": "title",
        "-name": "-title",
        "updated_at": "updated_at",
        "-updated_at": "-updated_at",
        "stock": "available_quantity",
        "-stock": "-available_quantity",
    }
    if ordering in allowed_orderings:
        qs = qs.order_by(allowed_orderings[ordering], "-id")
    return qs


def get_storefront_product_detail(dealer, product_id):
    """Chi tiết một sản phẩm active thuộc gian hàng."""
    stock_filter = _active_batch_stock_filter()
    return (
        get_storefront_products_qs(dealer)
        .filter(pk=product_id)
        .first()
    )

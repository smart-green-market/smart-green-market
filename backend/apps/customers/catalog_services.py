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
from apps.orders.models import OrderStatus

# Đơn đã xác nhận trở đi — tính vào số lượng bán.
_BESTSELLER_ORDER_STATUSES = (
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
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
    return (
        get_storefront_products_qs(dealer)
        .prefetch_related("supplier_product__cultivation_processes")
        .filter(pk=product_id)
        .first()
    )


def get_storefront_bestseller_products_qs(dealer):
    """Sản phẩm active sắp xếp theo tổng số lượng đã bán (đơn buyer không hủy)."""
    sold_filter = Q(order_items__order__status__in=_BESTSELLER_ORDER_STATUSES)
    return (
        get_storefront_products_qs(dealer)
        .annotate(
            total_sold=Coalesce(
                Sum("order_items__quantity", filter=sold_filter),
                0,
            )
        )
        .filter(total_sold__gt=0)
        .order_by("-total_sold", "-updated_at", "-id")
    )


def get_storefront_delivery_policy():
    """Chính sách giao hàng tĩnh — hiển thị trang About (không tính slot theo ngày)."""
    from apps.orders.delivery_slots import get_delivery_slot_config
    from apps.system_config.services import get_system_settings

    settings_row = get_system_settings()
    return {
        **get_delivery_slot_config(),
        "shipping_fee": settings_row.shipping_fee,
        "min_order_amount": settings_row.min_order_amount,
    }


def build_storefront_dealer_about_context(dealer):
    """Dữ liệu bổ sung cho trang About — vài aggregate query, không embed danh sách."""
    from django.contrib.auth import get_user_model

    from apps.accounts.models import AccountRole
    from apps.dealer_products.models import DealerProduct, DealerProductStatus
    from apps.orders.models import Order, OrderItem, OrderStatus
    from apps.reviews.services import get_dealer_review_summary

    Account = get_user_model()
    sold_filter = Q(order__status__in=_BESTSELLER_ORDER_STATUSES)

    active_product_count = DealerProduct.objects.filter(
        dealer_profile=dealer,
        status=DealerProductStatus.ACTIVE,
    ).count()
    category_count = (
        get_storefront_categories_qs(dealer).filter(product_count__gt=0).count()
    )
    customer_count = Account.objects.filter(
        role=AccountRole.BUYER,
        store_dealer=dealer,
    ).count()
    completed_order_count = Order.objects.filter(
        dealer=dealer,
        status=OrderStatus.COMPLETED,
    ).count()
    total_sold = (
        OrderItem.objects.filter(order__dealer=dealer)
        .filter(sold_filter)
        .aggregate(total=Coalesce(Sum("quantity"), 0))["total"]
    )

    return {
        "stats": {
            "active_product_count": active_product_count,
            "category_count": category_count,
            "customer_count": customer_count,
            "completed_order_count": completed_order_count,
            "total_sold": int(total_sold or 0),
        },
        "review_summary": get_dealer_review_summary(dealer=dealer),
        "delivery_policy": get_storefront_delivery_policy(),
    }


def parse_bestseller_limit(raw, *, default=10, max_limit=20):
    """Parse query `limit` cho API sản phẩm bán chạy."""
    try:
        value = int(raw) if raw is not None else default
    except (TypeError, ValueError):
        value = default
    return max(1, min(value, max_limit))

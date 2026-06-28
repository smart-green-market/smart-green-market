"""Soft-delete sản phẩm đại lý."""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.orders.models import OrderItem, OrderStatus
from common.soft_delete import soft_delete_blocked

from .models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)

ORDER_TERMINAL_STATUSES = {
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
}


def _open_customer_order_count(product) -> int:
    return (
        OrderItem.objects.filter(dealer_product=product)
        .exclude(order__status__in=ORDER_TERMINAL_STATUSES)
        .values("order_id")
        .distinct()
        .count()
    )


def _remaining_inventory_quantity(product) -> int:
    today = timezone.localdate()
    batches = DealerInventoryBatch.objects.filter(
        dealer_product=product,
        deleted_at__isnull=True,
        remaining_quantity__gt=0,
    ).filter(
        Q(expiry_date__isnull=True) | Q(expiry_date__gte=today),
    )
    return sum(b.remaining_quantity for b in batches)


@transaction.atomic
def soft_delete_dealer_product(product: DealerProduct, user):
    """Ẩn sản phẩm bán lẻ (status=deleted) sau khi kiểm tra đơn buyer và tồn kho."""
    if product.status == DealerProductStatus.DELETED:
        return product

    open_orders = _open_customer_order_count(product)
    if open_orders:
        soft_delete_blocked(
            code="has_open_customer_orders",
            detail=(
                "Không thể xóa sản phẩm vì còn đơn hàng khách chưa kết thúc. "
                "Chờ đơn hoàn tất hoặc hủy trước khi xóa."
            ),
            open_customer_orders=open_orders,
        )

    remaining = _remaining_inventory_quantity(product)
    if remaining > 0:
        soft_delete_blocked(
            code="has_inventory_remaining",
            detail=(
                "Không thể xóa sản phẩm vì còn tồn kho. "
                "Xử lý tồn (bán hết, hao hụt hoặc ngừng bán) trước khi xóa."
            ),
            remaining_quantity=remaining,
        )

    product.status = DealerProductStatus.DELETED
    product.save(update_fields=["status", "updated_at"])
    return product

"""Phân bổ tồn cho đơn waiting_stock khi hàng nhập kho."""

from django.db import transaction

from apps.dealer_products.age_discount import price_for_order_allocation

from .models import OrderItem, OrderStatus
from .services import _active_batches_qs, _deduct_batch, record_status_change


def _order_items_pending_allocation(dealer_product_id):
    """OrderItem chưa có batch trên đơn waiting_stock."""
    return (
        OrderItem.objects.filter(
            dealer_product_id=dealer_product_id,
            batch__isnull=True,
            order__status=OrderStatus.WAITING_STOCK,
        )
        .select_related("order", "dealer_product")
        .order_by(
            "order__delivery_time",
            "order__created_at",
            "order_id",
            "id",
        )
    )


def _try_allocate_order_item(order_item, user):
    """Phân bổ từ lô MAIN — trả True nếu đã allocate."""
    product = order_item.dealer_product
    quantity = order_item.quantity
    batch = _active_batches_qs(product).first()
    if batch is None or batch.remaining_quantity < quantity:
        return False

    unit_price = price_for_order_allocation(batch, quantity)
    order_item.batch = batch
    order_item.unit_price = unit_price
    order_item.subtotal = unit_price * quantity
    order_item.import_price = batch.import_price
    order_item.save(
        update_fields=[
            "batch",
            "unit_price",
            "subtotal",
            "import_price",
        ]
    )
    _deduct_batch(batch, quantity, order_item.order.order_code, user)
    return True


def _order_fully_allocated(order):
    return not order.items.filter(batch__isnull=True).exists()


@transaction.atomic
def try_allocate_waiting_orders(*, dealer_product_id=None, user=None):
    """Thử phân bổ mọi dòng waiting_stock — gọi sau nhập kho."""
    if user is None:
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.filter(is_superuser=True).first()

    product_ids = []
    if dealer_product_id:
        product_ids = [dealer_product_id]
    else:
        product_ids = list(
            OrderItem.objects.filter(
                batch__isnull=True,
                order__status=OrderStatus.WAITING_STOCK,
            )
            .values_list("dealer_product_id", flat=True)
            .distinct()
        )

    allocated_orders = []
    for pid in product_ids:
        for order_item in list(_order_items_pending_allocation(pid)):
            if _try_allocate_order_item(order_item, user):
                order = order_item.order
                if _order_fully_allocated(order) and order.status == OrderStatus.WAITING_STOCK:
                    record_status_change(
                        order,
                        OrderStatus.PROCESSING,
                        user,
                        note="Đã phân bổ tồn — bắt đầu chuẩn bị hàng",
                    )
                    allocated_orders.append(order)
    return allocated_orders

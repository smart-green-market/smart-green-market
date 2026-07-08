"""Phân bổ tồn cho đơn waiting_stock khi hàng nhập kho."""

from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.dealer_products.age_discount import price_for_order_allocation
from apps.dealer_products.inventory_expiry import mark_expired_inventory_batches
from apps.dealer_products.models import (
    DealerInventoryBatchStatus,
    DealerInventoryTransactionType,
    DealerProduct,
)
from apps.dealer_products.services import annotate_dealer_product_stock

from .models import CustomerPaymentType, Order, OrderItem, OrderStatus, OrderStatusHistory
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
    """Phân bổ FIFO cho một dòng — trả True nếu đã allocate."""
    product = order_item.dealer_product
    quantity = order_item.quantity
    remaining = quantity
    allocations = []
    for batch in _active_batches_qs(product):
        if remaining <= 0:
            break
        take = min(batch.remaining_quantity, remaining)
        if take > 0:
            allocations.append((batch, take))
            remaining -= take

    if remaining > 0:
        return False

    if len(allocations) == 1:
        batch, batch_qty = allocations[0]
        unit_price = price_for_order_allocation(batch, batch_qty)
        order_item.batch = batch
        order_item.unit_price = unit_price
        order_item.subtotal = unit_price * batch_qty
        order_item.import_price = batch.import_price
        order_item.save(
            update_fields=[
                "batch",
                "unit_price",
                "subtotal",
                "import_price",
            ]
        )
        _deduct_batch(batch, batch_qty, order_item.order.order_code, user)
        return True

    first_batch, first_qty = allocations[0]
    unit_price = price_for_order_allocation(first_batch, first_qty)
    order_item.batch = first_batch
    order_item.unit_price = unit_price
    order_item.quantity = first_qty
    order_item.subtotal = unit_price * first_qty
    order_item.import_price = first_batch.import_price
    order_item.save(
        update_fields=[
            "batch",
            "unit_price",
            "quantity",
            "subtotal",
            "import_price",
        ]
    )
    _deduct_batch(first_batch, first_qty, order_item.order.order_code, user)

    order = order_item.order
    for batch, batch_qty in allocations[1:]:
        line_price = price_for_order_allocation(batch, batch_qty)
        from .models import OrderItem

        OrderItem.objects.create(
            order=order,
            dealer_product=product,
            batch=batch,
            product_title=order_item.product_title,
            unit=order_item.unit,
            quantity=batch_qty,
            unit_price=line_price,
            import_price=batch.import_price,
            subtotal=line_price * batch_qty,
        )
        _deduct_batch(batch, batch_qty, order.order_code, user)

    subtotal = sum(
        line.subtotal for line in order.items.all()
    )
    order.subtotal_amount = subtotal
    order.total_amount = subtotal - order.discount_amount + order.shipping_fee
    order.debt_amount = order.total_amount - order.paid_amount
    order.save(
        update_fields=[
            "subtotal_amount",
            "total_amount",
            "debt_amount",
            "updated_at",
        ]
    )
    payment = order.payments.filter(payment_type=CustomerPaymentType.COD).order_by("-id").first()
    if payment:
        payment.amount = order.total_amount
        payment.save(update_fields=["amount"])
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
        mark_expired_inventory_batches(
            dealer_profile_id=DealerProduct.objects.filter(pk=pid)
            .values_list("dealer_profile_id", flat=True)
            .first()
        )
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

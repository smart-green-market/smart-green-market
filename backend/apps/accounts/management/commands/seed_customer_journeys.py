"""Sinh đơn hàng + tương tác SP cho phân tích / AI (không phân persona)."""

from __future__ import annotations

import random
import uuid
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Max, Sum
from django.utils import timezone

from apps.customers.models import CustomerProfile
from apps.dealer_products.models import DealerInventoryBatch, DealerProduct, DealerProductStatus
from apps.marketing.models import CustomerInteraction
from apps.orders.models import Order, OrderItem, OrderStatus

DEFAULT_ORDERS_RANGE = (3, 12)
DEFAULT_BROWSE_PRODUCTS_RANGE = (8, 25)
DEFAULT_VIEW_COUNT_RANGE = (5, 30)
DEFAULT_ADD_CART_RANGE = (2, 12)
COMPLETED_ORDER_RATIO = 0.90


def generate_order_timestamp(*, history_days: int) -> timezone.datetime:
    day_offset = random.randint(1, max(history_days, 1))
    base_date = timezone.now() - timedelta(days=day_offset)

    weekday = base_date.weekday()
    if weekday < 5 and random.random() < 0.25:
        days_to_shift = (5 if random.random() < 0.5 else 6) - weekday
        base_date += timedelta(days=days_to_shift)

    if random.random() < 0.65:
        hour = random.randint(7, 9) if random.random() < 0.5 else random.randint(17, 20)
    else:
        off_peak = [h for h in range(24) if h not in {7, 8, 9, 17, 18, 19, 20}]
        hour = random.choice(off_peak)

    return base_date.replace(
        hour=hour,
        minute=random.randint(0, 59),
        second=random.randint(0, 59),
        microsecond=0,
    )


def _pick_order_status() -> str:
    roll = random.random()
    if roll < COMPLETED_ORDER_RATIO:
        return OrderStatus.COMPLETED
    if roll < COMPLETED_ORDER_RATIO + 0.04:
        return OrderStatus.CANCELLED
    if roll < COMPLETED_ORDER_RATIO + 0.07:
        return OrderStatus.PENDING
    if roll < COMPLETED_ORDER_RATIO + 0.09:
        return OrderStatus.CONFIRMED
    return random.choice([OrderStatus.PROCESSING, OrderStatus.SHIPPING, OrderStatus.DELIVERED])


def _upsert_interaction(
    *,
    customer,
    dealer,
    dealer_product,
    view_count: int,
    add_cart_count: int,
    purchase_count: int,
    last_viewed_at,
    last_added_at=None,
    last_purchased_at=None,
) -> None:
    interaction, created = CustomerInteraction.objects.get_or_create(
        customer=customer,
        dealer=dealer,
        dealer_product=dealer_product,
        defaults={
            "view_count": view_count,
            "add_cart_count": add_cart_count,
            "purchase_count": purchase_count,
            "last_viewed_at": last_viewed_at,
            "last_added_at": last_added_at,
            "last_purchased_at": last_purchased_at,
        },
    )
    if created:
        return
    interaction.view_count += view_count
    interaction.add_cart_count += add_cart_count
    interaction.purchase_count += purchase_count
    if last_viewed_at and (
        interaction.last_viewed_at is None or last_viewed_at > interaction.last_viewed_at
    ):
        interaction.last_viewed_at = last_viewed_at
    if last_added_at and (
        interaction.last_added_at is None or last_added_at > interaction.last_added_at
    ):
        interaction.last_added_at = last_added_at
    if last_purchased_at and (
        interaction.last_purchased_at is None or last_purchased_at > interaction.last_purchased_at
    ):
        interaction.last_purchased_at = last_purchased_at
    interaction.save(
        update_fields=[
            "view_count",
            "add_cart_count",
            "purchase_count",
            "last_viewed_at",
            "last_added_at",
            "last_purchased_at",
            "updated_at",
        ]
    )


def _seed_browse_interactions(
    *,
    customer,
    dealer,
    dealer_products: list[DealerProduct],
    history_days: int,
    purchased_product_ids: set[int],
) -> None:
    browse_pool = [dp for dp in dealer_products if dp.id not in purchased_product_ids]
    if not browse_pool:
        browse_pool = dealer_products

    browse_count = random.randint(*DEFAULT_BROWSE_PRODUCTS_RANGE)
    browse_count = min(browse_count, len(browse_pool))
    if browse_count <= 0:
        return

    for dp in random.sample(browse_pool, browse_count):
        viewed_at = generate_order_timestamp(history_days=history_days)
        _upsert_interaction(
            customer=customer,
            dealer=dealer,
            dealer_product=dp,
            view_count=random.randint(*DEFAULT_VIEW_COUNT_RANGE),
            add_cart_count=random.randint(*DEFAULT_ADD_CART_RANGE),
            purchase_count=0,
            last_viewed_at=viewed_at,
            last_added_at=viewed_at + timedelta(minutes=random.randint(1, 20)),
        )


def _create_single_order(
    *,
    customer,
    dealer,
    address,
    dealer_products: list[DealerProduct],
    history_days: int,
    batch_map: dict[int, DealerInventoryBatch],
) -> tuple[Order | None, set[int]]:
    status = _pick_order_status()
    created_at = generate_order_timestamp(history_days=history_days)

    ranges = [(1, 2), (2, 4), (4, 7), (8, 12)]
    weights = [0.45, 0.30, 0.18, 0.07]
    chosen_range = random.choices(ranges, weights=weights)[0]
    num_items = random.randint(chosen_range[0], chosen_range[1])
    is_large_order = random.random() < 0.10

    sampled_prods = random.sample(dealer_products, min(num_items, len(dealer_products)))
    purchased_ids: set[int] = set()

    delivered_at = None
    completed_at = None
    cancelled_at = None

    if status == OrderStatus.COMPLETED:
        delivered_at = created_at + timedelta(hours=random.randint(2, 8))
        completed_at = delivered_at + timedelta(hours=random.randint(1, 24))
    elif status == OrderStatus.CANCELLED:
        cancelled_at = created_at + timedelta(hours=random.randint(1, 48))
    elif status in {OrderStatus.DELIVERED, OrderStatus.SHIPPING}:
        delivered_at = created_at + timedelta(hours=random.randint(4, 72))

    order = Order.objects.create(
        order_code=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        customer=customer,
        dealer=dealer,
        customer_address=address,
        status=status,
        receiver_name=address.receiver_name,
        receiver_phone=address.receiver_phone,
        delivery_address=address.address,
        delivery_time=delivered_at or (created_at + timedelta(hours=3)),
        note=random.choice(["Giao giờ hành chính", "Giao buổi tối", "Không cần túi nilon", ""]),
        delivered_at=delivered_at,
        completed_at=completed_at,
        cancelled_at=cancelled_at,
        cancel_reason="Khách đổi ý" if status == OrderStatus.CANCELLED else "",
    )

    total_amount = Decimal("0")
    for dp in sampled_prods:
        batch = batch_map.get(dp.id)
        if not batch:
            continue

        if is_large_order:
            qty = random.randint(5, 15)
        elif dp.retail_price > Decimal("100000"):
            qty = random.randint(1, 2)
        else:
            qty = random.randint(1, 4)

        subtotal = dp.retail_price * qty
        total_amount += subtotal
        purchased_ids.add(dp.id)

        OrderItem.objects.create(
            order=order,
            dealer_product=dp,
            batch=batch,
            product_title=dp.title,
            unit=dp.supplier_product.unit,
            quantity=qty,
            unit_price=dp.retail_price,
            import_price=batch.import_price,
            subtotal=subtotal,
        )

        _upsert_interaction(
            customer=customer,
            dealer=dealer,
            dealer_product=dp,
            view_count=random.randint(2, 12),
            add_cart_count=random.randint(1, 5),
            purchase_count=qty if status == OrderStatus.COMPLETED else 0,
            last_viewed_at=created_at - timedelta(minutes=random.randint(5, 45)),
            last_added_at=created_at - timedelta(minutes=random.randint(2, 15)),
            last_purchased_at=created_at if status == OrderStatus.COMPLETED else None,
        )

    if status == OrderStatus.COMPLETED:
        paid_amount = total_amount
        debt_amount = Decimal("0")
    else:
        paid_amount = Decimal("0")
        debt_amount = Decimal("0") if status == OrderStatus.CANCELLED else total_amount

    order.subtotal_amount = total_amount
    order.total_amount = total_amount
    order.paid_amount = paid_amount
    order.debt_amount = debt_amount
    order.save(
        update_fields=[
            "subtotal_amount",
            "total_amount",
            "paid_amount",
            "debt_amount",
            "updated_at",
        ]
    )
    Order.objects.filter(pk=order.pk).update(created_at=created_at)
    return order, purchased_ids


def seed_customer_journeys(
    *,
    buyers: list[CustomerProfile],
    history_days: int = 120,
    orders_range: tuple[int, int] | None = None,
) -> dict[str, int]:
    """Tạo đơn + tương tác SP cho từng buyer."""
    order_bounds = orders_range or DEFAULT_ORDERS_RANGE
    stats = {"orders": 0, "completed_orders": 0, "interactions": 0}

    for buyer in buyers:
        dealer = buyer.user.store_dealer
        if not dealer:
            continue

        address = buyer.addresses.first()
        if not address:
            continue

        dealer_products = list(
            DealerProduct.objects.filter(
                dealer_profile=dealer,
                status=DealerProductStatus.ACTIVE,
            ).select_related("supplier_product")
        )
        if not dealer_products:
            continue

        batch_map: dict[int, DealerInventoryBatch] = {}
        for batch in DealerInventoryBatch.objects.filter(
            dealer_product__in=dealer_products
        ).order_by("-import_date"):
            if batch.dealer_product_id not in batch_map:
                batch_map[batch.dealer_product_id] = batch

        num_orders = random.randint(*order_bounds)
        all_purchased_ids: set[int] = set()

        for _ in range(num_orders):
            order, purchased_ids = _create_single_order(
                customer=buyer,
                dealer=dealer,
                address=address,
                dealer_products=dealer_products,
                history_days=history_days,
                batch_map=batch_map,
            )
            if order is None:
                continue
            stats["orders"] += 1
            if order.status == OrderStatus.COMPLETED:
                stats["completed_orders"] += 1
            all_purchased_ids |= purchased_ids

        _seed_browse_interactions(
            customer=buyer,
            dealer=dealer,
            dealer_products=dealer_products,
            history_days=history_days,
            purchased_product_ids=all_purchased_ids,
        )

    stats["interactions"] = CustomerInteraction.objects.count()
    sync_customer_profile_stats(buyers)
    return stats


def sync_customer_profile_stats(buyers: list[CustomerProfile]) -> None:
    """Đồng bộ total_orders / total_spent / last_order_at từ đơn completed."""
    buyer_ids = [b.id for b in buyers]
    aggregates = (
        Order.objects.filter(
            customer_id__in=buyer_ids,
            status=OrderStatus.COMPLETED,
        )
        .values("customer_id")
        .annotate(
            total_orders=Count("id"),
            total_spent=Sum("total_amount"),
            last_order_at=Max("completed_at"),
        )
    )
    agg_map = {row["customer_id"]: row for row in aggregates}

    for buyer in buyers:
        row = agg_map.get(buyer.id)
        if not row:
            buyer.total_orders = 0
            buyer.total_spent = Decimal("0")
            buyer.last_order_at = None
            buyer.loyalty_points = CustomerInteraction.objects.filter(customer=buyer).count()
        else:
            buyer.total_orders = row["total_orders"] or 0
            buyer.total_spent = row["total_spent"] or Decimal("0")
            buyer.last_order_at = row["last_order_at"]
            buyer.loyalty_points = int(buyer.total_spent // Decimal("10000")) + buyer.total_orders * 5
        buyer.save(
            update_fields=[
                "total_orders",
                "total_spent",
                "last_order_at",
                "loyalty_points",
                "updated_at",
            ]
        )

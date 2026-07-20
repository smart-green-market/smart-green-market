"""Sinh đơn hàng + tương tác SP cho phân tích / AI theo tier khách hàng (deterministic)."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Max, Sum

from apps.customers.models import CustomerProfile
from apps.dealer_products.models import DealerInventoryBatch, DealerProduct, DealerProductStatus
from apps.marketing.models import CustomerInteraction, CustomerSegment, CustomerSegmentMember
from apps.orders.models import Order, OrderItem, OrderStatus

from .seed_dealer_customer_tiers import BuyerSeedSpec, segment_code_for_tier
from .seed_deterministic import (
    deterministic_order_amount,
    deterministic_order_code,
    deterministic_order_count,
    deterministic_order_created_at,
)
from .seed_product_helpers import int_money


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
    spec: BuyerSeedSpec,
    dealer,
    dealer_products: list[DealerProduct],
    purchased_product_ids: set[int],
) -> None:
    browse_pool = sorted(
        [dp for dp in dealer_products if dp.id not in purchased_product_ids],
        key=lambda dp: dp.id,
    )
    if not browse_pool:
        browse_pool = sorted(dealer_products, key=lambda dp: dp.id)

    browse_count = min(8, len(browse_pool))
    if browse_count <= 0:
        return

    for dp in browse_pool[:browse_count]:
        viewed_at = deterministic_order_created_at(
            spec.dealer_index, spec.slot, order_index=0
        ) - timedelta(days=3)
        _upsert_interaction(
            customer=spec.profile,
            dealer=dealer,
            dealer_product=dp,
            view_count=10 + spec.slot % 5,
            add_cart_count=3 + spec.slot % 4,
            purchase_count=0,
            last_viewed_at=viewed_at,
            last_added_at=viewed_at + timedelta(minutes=5),
        )


def _priced_products_with_batches(
    dealer_products: list[DealerProduct],
    batch_map: dict[int, DealerInventoryBatch],
) -> list[tuple[DealerProduct, DealerInventoryBatch]]:
    rows: list[tuple[DealerProduct, DealerInventoryBatch]] = []
    for dp in dealer_products:
        batch = batch_map.get(dp.id)
        if batch and batch.remaining_quantity > 0 and int(dp.retail_price) > 0:
            rows.append((dp, batch))
    rows.sort(key=lambda row: (-int(row[0].retail_price), row[0].id))
    return rows


def _plan_order_lines(
    *,
    priced: list[tuple[DealerProduct, DealerInventoryBatch]],
    target: int,
    amount_range: tuple[int, int],
) -> list[tuple[DealerProduct, DealerInventoryBatch, int, Decimal, Decimal]]:
    if not priced:
        return []

    low, high = amount_range
    dp, batch = priced[0]
    unit_price = int_money(dp.retail_price)
    unit_int = int(unit_price)
    max_qty = max(1, int(batch.remaining_quantity))

    qty = min(max_qty, max(1, target // unit_int))
    total = unit_int * qty

    lines: list[tuple[DealerProduct, DealerInventoryBatch, int, Decimal, Decimal]] = [
        (dp, batch, qty, unit_price, int_money(total))
    ]

    if total < low and max_qty > qty:
        extra_needed = low - total
        extra_qty = min(max_qty - qty, (extra_needed + unit_int - 1) // unit_int)
        if extra_qty > 0:
            qty += extra_qty
            total = unit_int * qty
            lines[0] = (dp, batch, qty, unit_price, int_money(total))

    if total < low and len(priced) > 1:
        for dp2, batch2 in priced[1:4]:
            if total >= low:
                break
            unit2 = int_money(dp2.retail_price)
            u2 = int(unit2)
            if u2 <= 0:
                continue
            max2 = int(batch2.remaining_quantity)
            need = low - total
            q2 = min(max2, max(1, need // u2))
            sub = u2 * q2
            lines.append((dp2, batch2, q2, unit2, int_money(sub)))
            total += sub

    if total > high and lines:
        dp, batch, qty, unit_price, _ = lines[0]
        u = int(unit_price)
        while qty > 1 and u * qty > high:
            qty -= 1
        lines[0] = (dp, batch, qty, unit_price, int_money(u * qty))

    return lines


def _create_single_order(
    *,
    spec: BuyerSeedSpec,
    dealer,
    address,
    dealer_products: list[DealerProduct],
    batch_map: dict[int, DealerInventoryBatch],
    order_index: int,
    order_amount_range: tuple[int, int],
) -> tuple[Order | None, set[int]]:
    created_at = deterministic_order_created_at(
        spec.dealer_index, spec.slot, order_index
    )
    priced = _priced_products_with_batches(dealer_products, batch_map)
    if not priced:
        return None, set()

    target = deterministic_order_amount(
        spec.dealer_index,
        spec.slot,
        order_index,
        order_amount_range,
    )
    line_plan = _plan_order_lines(
        priced=priced,
        target=target,
        amount_range=order_amount_range,
    )
    if not line_plan:
        return None, set()

    purchased_ids: set[int] = set()
    delivered_at = created_at + timedelta(hours=4)
    completed_at = delivered_at + timedelta(hours=12)

    order = Order.objects.create(
        order_code=deterministic_order_code(spec.dealer_index, spec.slot, order_index),
        customer=spec.profile,
        dealer=dealer,
        customer_address=address,
        status=OrderStatus.COMPLETED,
        receiver_name=address.receiver_name,
        receiver_phone=address.receiver_phone,
        delivery_address=address.address,
        delivery_time=delivered_at,
        note="",
        delivered_at=delivered_at,
        completed_at=completed_at,
        cancelled_at=None,
        cancel_reason="",
    )

    total_amount = int_money(0)
    for dp, batch, qty, unit_price, subtotal in line_plan:
        total_amount = int_money(int(total_amount) + int(subtotal))
        purchased_ids.add(dp.id)

        OrderItem.objects.create(
            order=order,
            dealer_product=dp,
            batch=batch,
            product_title=dp.title,
            unit=dp.supplier_product.unit,
            quantity=qty,
            unit_price=unit_price,
            import_price=int_money(batch.import_price),
            subtotal=subtotal,
        )

        _upsert_interaction(
            customer=spec.profile,
            dealer=dealer,
            dealer_product=dp,
            view_count=5,
            add_cart_count=2,
            purchase_count=qty,
            last_viewed_at=created_at - timedelta(minutes=10),
            last_added_at=created_at - timedelta(minutes=5),
            last_purchased_at=created_at,
        )

    order.subtotal_amount = total_amount
    order.total_amount = total_amount
    order.paid_amount = total_amount
    order.debt_amount = int_money(0)
    order.discount_amount = int_money(0)
    order.shipping_fee = int_money(0)
    order.save(
        update_fields=[
            "subtotal_amount",
            "total_amount",
            "paid_amount",
            "debt_amount",
            "discount_amount",
            "shipping_fee",
            "updated_at",
        ]
    )
    Order.objects.filter(pk=order.pk).update(created_at=created_at)
    return order, purchased_ids


def seed_customer_journeys(
    *,
    buyer_specs: list[BuyerSeedSpec],
    history_days: int = 120,
) -> dict[str, int]:
    """Tạo đơn + tương tác SP theo tier từng khách hàng."""
    del history_days  # dùng SEED_HISTORY_ANCHOR
    stats = {"orders": 0, "completed_orders": 0, "interactions": 0}
    profiles = [spec.profile for spec in buyer_specs]

    for spec in buyer_specs:
        tier = spec.tier
        buyer = spec.profile
        dealer = buyer.user.store_dealer
        if not dealer:
            continue

        if tier.kind == "passive":
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

        assert tier.order_amount_range is not None
        num_orders = deterministic_order_count(spec.dealer_index, spec.slot)
        all_purchased_ids: set[int] = set()

        for order_index in range(num_orders):
            order, purchased_ids = _create_single_order(
                spec=spec,
                dealer=dealer,
                address=address,
                dealer_products=dealer_products,
                batch_map=batch_map,
                order_index=order_index,
                order_amount_range=tier.order_amount_range,
            )
            if order is None:
                continue
            stats["orders"] += 1
            if order.status == OrderStatus.COMPLETED:
                stats["completed_orders"] += 1
            all_purchased_ids |= purchased_ids

        _seed_browse_interactions(
            spec=spec,
            dealer=dealer,
            dealer_products=dealer_products,
            purchased_product_ids=all_purchased_ids,
        )

    stats["interactions"] = CustomerInteraction.objects.count()
    sync_customer_profile_stats(profiles)
    seed_customer_segment_memberships(buyer_specs)
    return stats


def seed_customer_segment_memberships(buyer_specs: list[BuyerSeedSpec]) -> None:
    """Gán mỗi khách vào đúng 1 trong 4 segment hệ thống (VIP, POTENTIAL, PASSIVE, CHURN_RISK)."""
    profile_ids = [spec.profile.id for spec in buyer_specs]
    CustomerSegmentMember.objects.filter(customer_profile_id__in=profile_ids).delete()

    segments = {
        row.code: row
        for row in CustomerSegment.objects.filter(
            code__in={"VIP", "POTENTIAL", "PASSIVE", "CHURN_RISK"},
        )
    }
    if not segments:
        return

    members: list[CustomerSegmentMember] = []
    for spec in buyer_specs:
        code = segment_code_for_tier(spec.tier, slot=spec.slot)
        segment = segments.get(code)
        if segment is None:
            continue
        members.append(
            CustomerSegmentMember(
                customer_profile=spec.profile,
                segment=segment,
            )
        )
    if members:
        CustomerSegmentMember.objects.bulk_create(members, ignore_conflicts=True)


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
            buyer.total_spent = int_money(0)
            buyer.last_order_at = None
            buyer.loyalty_points = 0
        else:
            buyer.total_orders = row["total_orders"] or 0
            buyer.total_spent = int_money(row["total_spent"] or 0)
            buyer.last_order_at = row["last_order_at"]
            buyer.loyalty_points = int(buyer.total_spent) // 10000 + buyer.total_orders * 5
        buyer.save(
            update_fields=[
                "total_orders",
                "total_spent",
                "last_order_at",
                "loyalty_points",
                "updated_at",
            ]
        )

"""Tổng hợp nhu cầu chờ hàng về kho (đơn buyer waiting_stock)."""

from django.db.models import Count, IntegerField, Q, Sum
from django.db.models.functions import Coalesce

from apps.accounts.models import AccountRole
from apps.orders.models import Order, OrderItem, OrderStatus


def _waiting_stock_item_q(*, dealer_profile_id=None):
    q = Q(
        order_items__batch__isnull=True,
        order_items__order__status=OrderStatus.WAITING_STOCK,
    )
    if dealer_profile_id is not None:
        q &= Q(order_items__order__dealer_id=dealer_profile_id)
    return q


def annotate_dealer_product_waiting_stock(qs, *, dealer_profile_id=None):
    """Gắn waiting_stock_quantity và waiting_stock_order_count lên queryset."""
    item_q = _waiting_stock_item_q(dealer_profile_id=dealer_profile_id)
    return qs.annotate(
        waiting_stock_quantity=Coalesce(
            Sum("order_items__quantity", filter=item_q),
            0,
            output_field=IntegerField(),
        ),
        waiting_stock_order_count=Count(
            "order_items__order",
            filter=item_q,
            distinct=True,
        ),
    )


def queryset_dealer_products_waiting_stock(qs, *, dealer_profile_id=None):
    """Sản phẩm có tổng SL trên đơn waiting_stock (chưa phân bổ lô) > 0."""
    qs = annotate_dealer_product_waiting_stock(qs, dealer_profile_id=dealer_profile_id)
    return qs.filter(waiting_stock_quantity__gt=0).order_by(
        "-waiting_stock_quantity",
        "-updated_at",
        "-id",
    )


def resolve_dealer_profile_id_for_waiting_stock(user, dealer_id_param):
    """
    Dealer: luôn scope theo hồ sơ đại lý của mình.
    Admin: optional ?dealer_id=; None = tất cả đại lý.
    """
    if user.role == AccountRole.DEALER:
        profile = getattr(user, "dealer_profile", None)
        return profile.id if profile else None
    if user.role == AccountRole.ADMIN and dealer_id_param not in (None, ""):
        try:
            return int(dealer_id_param)
        except (TypeError, ValueError) as exc:
            raise ValueError("dealer_id phải là số nguyên.") from exc
    return None


def waiting_stock_summary(*, dealer_profile_id=None):
    """Thống kê đơn / SL chờ hàng về kho (một đại lý hoặc toàn hệ thống)."""
    order_qs = Order.objects.filter(status=OrderStatus.WAITING_STOCK)
    item_qs = OrderItem.objects.filter(
        batch__isnull=True,
        order__status=OrderStatus.WAITING_STOCK,
    )
    if dealer_profile_id is not None:
        order_qs = order_qs.filter(dealer_id=dealer_profile_id)
        item_qs = item_qs.filter(order__dealer_id=dealer_profile_id)

    total_qty = item_qs.aggregate(
        total=Coalesce(Sum("quantity"), 0, output_field=IntegerField()),
    )["total"]

    return {
        "waiting_stock_order_count": order_qs.count(),
        "waiting_stock_line_quantity_total": total_qty,
    }

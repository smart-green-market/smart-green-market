"""Metrics khách hàng theo đại lý — phục vụ  / phân tích."""

from datetime import timedelta

from django.db.models import Count, Max, Sum
from django.utils import timezone

from apps.marketing.models import CustomerInteraction
from apps.orders.models import Order, OrderStatus

SUCCESSFUL_ORDER_STATUSES = (OrderStatus.COMPLETED,)


def get_dealer_customer_snapshot(*, dealer_id: int, days: int) -> list[dict]:
    """
    Trả về danh sách khách đã có đơn completed với dealer trong khoảng [now - days, now].

    Mỗi phần tử:
    - customer_id
    - Last_order: số ngày từ lần mua gần nhất (trong kỳ) đến hôm nay
    - Total_order: số đơn completed trong kỳ
    - Total_spent: tổng total_amount trong kỳ
    - Conversion_rate: Total_order / Total_click * 100 (view_count từ CustomerInteraction)
    """
    if days <= 0:
        raise ValueError("days phải lớn hơn 0")

    since = timezone.now() - timedelta(days=days)
    today = timezone.localdate()

    order_stats = (
        Order.objects.filter(
            dealer_id=dealer_id,
            status__in=SUCCESSFUL_ORDER_STATUSES,
            completed_at__gte=since,
            completed_at__isnull=False,
        )
        .values("customer_id")
        .annotate(
            total_order=Count("id"),
            total_spent=Sum("total_amount"),
            last_order_at=Max("completed_at"),
        )
        .order_by("customer_id")
    )

    rows = list(order_stats)
    if not rows:
        return []

    customer_ids = [r["customer_id"] for r in rows]

    click_map = {
        row["customer_id"]: row["total_click"] or 0
        for row in CustomerInteraction.objects.filter(
            dealer_id=dealer_id,
            customer_id__in=customer_ids,
            last_viewed_at__gte=since,
        )
        .values("customer_id")
        .annotate(total_click=Sum("view_count"))
    }

    result = []
    for row in rows:
        customer_id = row["customer_id"]
        total_order = row["total_order"]
        total_click = click_map.get(customer_id, 0)
        conversion_rate = (
            round(total_order / total_click * 100, 2) if total_click else 0.0
        )

        result.append(
            {
                "customer_id": customer_id,
                "Last_order": (today - row["last_order_at"].date()).days,
                "Total_order": total_order,
                "Total_spent": float(row["total_spent"] or 0),
                "Conversion_rate": conversion_rate,
            }
        )

    return result
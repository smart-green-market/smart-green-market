"""Gửi thông báo khi trạng thái đơn buyer thay đổi."""

from django.contrib.auth import get_user_model

from common.notification_messages import customer_order_status_updated
from common.notifications import notify_account

Account = get_user_model()


def notify_customer_order_status_change(order, *, actor, old_status=""):
    """Gửi notification cho dealer và/hoặc buyer khi status đổi."""
    title, content, notif_type = customer_order_status_updated(
        order,
        old_status=old_status,
    )
    targets = {order.dealer.account_id, order.customer.user_id}
    actor_id = getattr(actor, "id", None)
    if actor_id:
        targets.discard(actor_id)

    for account_id in targets:
        notify_account(
            account=Account.objects.get(pk=account_id),
            title=title,
            content=content,
            reference_type="customer_order",
            reference_id=order.id,
            created_by=actor,
            notif_type=notif_type,
        )

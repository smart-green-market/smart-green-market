"""Gửi thông báo khi trạng thái phiếu nhập thay đổi."""

from django.contrib.auth import get_user_model

from common.notification_messages import purchase_order_status_updated
from common.notifications import notify_account

Account = get_user_model()


def notify_purchase_order_status_change(order, *, actor, old_status=""):
    """Gửi notification cho bên còn lại (dealer ↔ supplier) khi status đổi.

    Gọi từ record_status_change — mỗi bước luồng đặt hàng đều trigger.
    FE: GET /api/notifications/my/ → reference_type=purchase_order → mở chi tiết đơn.
    """
    title, content, notif_type = purchase_order_status_updated(
        order,
        old_status=old_status,
    )
    targets = {order.dealer.account_id, order.supplier.account_id}
    actor_id = getattr(actor, "id", None)
    if actor_id:
        targets.discard(actor_id)

    for account_id in targets:
        notify_account(
            account=Account.objects.get(pk=account_id),
            title=title,
            content=content,
            reference_type="purchase_order",
            reference_id=order.id,
            created_by=actor,
            notif_type=notif_type,
        )

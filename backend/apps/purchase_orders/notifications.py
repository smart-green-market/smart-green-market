"""Gửi thông báo khi trạng thái phiếu nhập thay đổi."""

from django.contrib.auth import get_user_model
from django.utils import timezone

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


def notify_delivery_time_adjusted(order, *, actor):
    """Thông báo dealer khi ngày giao NCC cam kết khác ngày dealer mong muốn."""
    if order.confirmed_delivery_time is None:
        return
    if order.confirmed_delivery_time == order.requested_delivery_time:
        return

    req_label = timezone.localtime(order.requested_delivery_time).strftime(
        "%d/%m/%Y %H:%M"
    )
    conf_label = timezone.localtime(order.confirmed_delivery_time).strftime(
        "%d/%m/%Y %H:%M"
    )

    if order.confirmed_delivery_time < order.requested_delivery_time:
        content = (
            f"Phiếu {order.order_code}: NCC giao sớm hơn dự kiến — "
            f"dealer mong {req_label}, NCC cam kết {conf_label}."
        )
        notif_type = "info"
    else:
        content = (
            f"Phiếu {order.order_code}: NCC giao muộn hơn dự kiến — "
            f"dealer mong {req_label}, NCC cam kết {conf_label}."
        )
        notif_type = "warning"

    notify_account(
        account=order.dealer.account,
        title=f"[Phiếu nhập] {order.order_code} — Lịch giao đã điều chỉnh",
        content=content,
        reference_type="purchase_order",
        reference_id=order.id,
        created_by=actor,
        notif_type=notif_type,
    )

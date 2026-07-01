"""Push notification events to connected WebSocket clients via Redis channel layer."""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.notifications.serializers_api import serialize_notification_receipt_for_push


def push_notification_to_account(account_id, receipt):
    """Gửi thông báo mới tới group WebSocket của một tài khoản."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    payload = {
        "event": "notification.new",
        **serialize_notification_receipt_for_push(receipt),
    }

    async_to_sync(channel_layer.group_send)(
        f"notifications_{account_id}",
        {
            "type": "notification.new",
            "payload": payload,
        },
    )

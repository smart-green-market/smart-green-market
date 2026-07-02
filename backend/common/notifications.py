"""Helper tạo thông báo và gửi tới admin hoặc tài khoản cụ thể."""

from django.contrib.auth import get_user_model

from apps.notifications.models import Notification, NotificationReceipt
from apps.notifications.realtime import push_notification_to_account
from common.notification_messages import plain_notification_text

User = get_user_model()


def notify_admins(title, content, reference_type, reference_id, created_by, notif_type="info"):
    """Tạo thông báo và gửi cho tất cả tài khoản admin."""
    admins = User.objects.filter(role="admin")
    if not admins.exists():
        return
    notification = Notification.objects.create(
        title=plain_notification_text(title),
        content=plain_notification_text(content),
        type=notif_type,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )
    receipts = NotificationReceipt.objects.bulk_create([
        NotificationReceipt(notification=notification, account=admin)
        for admin in admins
    ])
    for receipt in receipts:
        receipt.notification = notification
        push_notification_to_account(receipt.account_id, receipt)


def notify_account(
    account,
    title,
    content,
    reference_type,
    reference_id,
    created_by,
    notif_type="info",
):
    """Tạo thông báo và gửi cho một tài khoản."""
    if account is None:
        return
    notification = Notification.objects.create(
        title=plain_notification_text(title),
        content=plain_notification_text(content),
        type=notif_type,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )
    receipt = NotificationReceipt.objects.create(
        notification=notification,
        account=account,
    )
    receipt.notification = notification
    push_notification_to_account(account.id, receipt)

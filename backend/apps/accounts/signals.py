"""Signal gửi thông báo cho admin khi có giấy tờ tài khoản mới."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from common.notification_messages import admin_new_account_document
from common.notifications import notify_admins

from .models import AccountDocument


@receiver(post_save, sender=AccountDocument)
def notify_admin_new_document(sender, instance, created, **kwargs):
    if not created:
        return
    title, content = admin_new_account_document(instance)
    notify_admins(
        title=title,
        content=content,
        reference_type="account_document",
        reference_id=instance.id,
        created_by=instance.account,
    )

from django.db.models.signals import post_save
from django.dispatch import receiver

from common.notification_messages import admin_new_supplier_document
from common.notifications import notify_admins
from .models import SupplierDocument


@receiver(post_save, sender=SupplierDocument)
def notify_admin_new_document(sender, instance, created, **kwargs):
    if not created:
        return
    title, content = admin_new_supplier_document(instance)
    notify_admins(
        title=title,
        content=content,
        reference_type="supplier_document",
        reference_id=instance.id,
        created_by=instance.supplier.account,
    )

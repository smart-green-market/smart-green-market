from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import SupplierDocument
from apps.notifications.models import Notification, NotificationReceipt
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=SupplierDocument)
def notify_admin_new_document(sender, instance, created, **kwargs):
    if not created:
        return
    notification = Notification.objects.create(
    title="Supplier document pending approval",
    content=f"Supplier {instance.supplier_id} uploaded a document waiting for review",
    type="info",
    reference_type="supplier_document",
    reference_id=instance.id,
    created_by=instance.supplier_id
    )
    admins = User.objects.filter(is_staff=True)

    NotificationReceipt.objects.bulk_create([
        NotificationReceipt(
            notification=notification,
            account=admin
        )
        for admin in admins
    ])
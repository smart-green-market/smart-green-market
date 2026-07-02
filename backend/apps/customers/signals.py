from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CustomerProfile
from .services import assign_default_customer_segment


@receiver(post_save, sender=CustomerProfile)
def assign_default_segment_on_create(sender, instance, created, **kwargs):
    if created:
        assign_default_customer_segment(instance)

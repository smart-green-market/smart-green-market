from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.customers.models import CustomerProfile
from apps.dealers.models import DealerProfile

from .services import assign_base_tier_to_customer
from .tier_defaults import seed_default_loyalty_for_dealer


@receiver(post_save, sender=DealerProfile)
def seed_loyalty_on_dealer_create(sender, instance, created, **kwargs):
    if created:
        seed_default_loyalty_for_dealer(instance)


@receiver(post_save, sender=CustomerProfile)
def assign_default_tier_on_customer_create(sender, instance, created, **kwargs):
    if created:
        assign_base_tier_to_customer(instance)

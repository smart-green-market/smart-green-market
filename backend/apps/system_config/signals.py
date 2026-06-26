from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import SystemSettings
from .services import invalidate_settings_cache


@receiver(post_save, sender=SystemSettings)
def clear_system_settings_cache(sender, **kwargs):
    invalidate_settings_cache()

"""Đọc/ghi cấu hình hệ thống — cache ngắn hạn, fallback default khi chưa migrate."""

from django.core.cache import cache
from django.db.utils import OperationalError, ProgrammingError

from .models import SystemSettings

CACHE_KEY = "system_settings_v1"
CACHE_TTL = 300

SYSTEM_SETTINGS_DEFAULTS = {
    "max_upload_image_size_mb": 5,
    "max_categories_per_supplier": 5,
    "max_products_per_supplier": 100,
    "max_images_per_product": 5,
    "max_images_per_certification": 5,
    "max_login_attempts": 5,
    "login_lockout_minutes": 15,
    "min_order_amount": 500_000,
    "max_order_amount": 500_000_000,
    "min_deposit_percent": 10,
    "max_deposit_percent": 50,
    "default_deposit_percent": 30,
    "min_delivery_lead_days": 2,
    "max_delivery_delay_days": 7,
    "shipping_fee": 10_000,
    "min_lead_hours": 6,
    "morning_cutoff_hour": 23,
    "max_booking_days": 2,
}


def _default_settings_instance():
    """Object in-memory khi bảng chưa sẵn sàng (migrate / import module)."""
    return SystemSettings(pk=SystemSettings.SINGLETON_PK, **SYSTEM_SETTINGS_DEFAULTS)


def invalidate_settings_cache():
    cache.delete(CACHE_KEY)


def get_system_settings():
    """Trả singleton SystemSettings — cache 5 phút."""
    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

    try:
        obj, _created = SystemSettings.objects.select_related("updated_by").get_or_create(
            pk=SystemSettings.SINGLETON_PK,
            defaults=SYSTEM_SETTINGS_DEFAULTS,
        )
    except (ProgrammingError, OperationalError):
        return _default_settings_instance()

    cache.set(CACHE_KEY, obj, CACHE_TTL)
    return obj

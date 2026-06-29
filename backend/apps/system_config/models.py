"""Cấu hình nghiệp vụ toàn hệ thống — singleton (pk=1), admin chỉnh qua API."""

from django.conf import settings
from django.db import models


class SystemSettings(models.Model):
    """Một bản ghi duy nhất chứa giới hạn nghiệp vụ có thể chỉnh bởi admin."""

    SINGLETON_PK = 1

    max_upload_image_size_mb = models.PositiveSmallIntegerField(default=5)
    max_categories_per_supplier = models.PositiveSmallIntegerField(default=5)
    max_products_per_supplier = models.PositiveSmallIntegerField(default=100)
    max_images_per_product = models.PositiveSmallIntegerField(default=5)
    max_images_per_certification = models.PositiveSmallIntegerField(default=5)

    max_login_attempts = models.PositiveSmallIntegerField(default=5)
    login_lockout_minutes = models.PositiveSmallIntegerField(default=15)

    min_order_amount = models.PositiveBigIntegerField(default=500_000)
    max_order_amount = models.PositiveBigIntegerField(default=500_000_000)
    min_deposit_percent = models.PositiveSmallIntegerField(default=10)
    max_deposit_percent = models.PositiveSmallIntegerField(default=50)
    default_deposit_percent = models.PositiveSmallIntegerField(default=30)
    min_delivery_lead_days = models.PositiveSmallIntegerField(default=2)
    max_delivery_delay_days = models.PositiveSmallIntegerField(
        default=7,
        help_text="NCC cam kết giao muộn nhất = requested + N ngày (khi confirm PO).",
    )

    shipping_fee = models.PositiveIntegerField(default=10_000)
    min_lead_hours = models.PositiveSmallIntegerField(default=6)
    morning_cutoff_hour = models.PositiveSmallIntegerField(default=23)
    max_booking_days = models.PositiveSmallIntegerField(default=2)

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="system_settings_updates",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "system_settings"
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    @property
    def max_upload_image_size_bytes(self):
        return self.max_upload_image_size_mb * 1024 * 1024

    def save(self, *args, **kwargs):
        self.pk = self.SINGLETON_PK
        super().save(*args, **kwargs)

    def __str__(self):
        return "System Settings"

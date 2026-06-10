"""Mô hình dữ liệu hồ sơ đại lý."""

from django.conf import settings
from django.db import models


class DealerProfileStatus(models.TextChoices):
    """Trạng thái hoạt động của hồ sơ đại lý."""

    PENDING = "pending", "Chờ duyệt"
    ACTIVE = "active", "Đang hoạt động"
    INACTIVE = "inactive", "Ngừng hoạt động"
    REJECTED = "rejected", "Từ chối"


class DealerProfile(models.Model):
    """Hồ sơ đại lý gắn một-một với tài khoản người dùng."""

    account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dealer_profile",
    )
    store_name = models.CharField(max_length=255)
    store_address = models.TextField()
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=DealerProfileStatus.choices,
        default=DealerProfileStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_dealer_profiles",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dealer_profiles"
        verbose_name = "Dealer Profile"
        verbose_name_plural = "Dealer Profiles"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.store_name

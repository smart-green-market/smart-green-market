"""Mô hình dữ liệu khách hàng gian hàng đại lý."""

from django.conf import settings
from django.db import models
from django.db.models import Q


class CustomerProfile(models.Model):
    """Hồ sơ buyer gắn 1-1 với Account storefront (mỗi đại lý một account)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    favorite_category = models.ForeignKey(
        "categories.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="favorite_customer_profiles",
    )

    total_orders = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    loyalty_points = models.PositiveIntegerField(default=0)
    last_order_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(
        blank=True,
        help_text="Ghi chú nội bộ của đại lý về khách hàng",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer_profiles"
        verbose_name = "Customer Profile"
        verbose_name_plural = "Customer Profiles"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.user.full_name or self.user.username

    @property
    def dealer_profile(self):
        return self.user.store_dealer


class CustomerAddress(models.Model):
    """Địa chỉ nhận hàng của buyer."""

    customer = models.ForeignKey(
        CustomerProfile,
        on_delete=models.CASCADE,
        related_name="addresses",
    )

    receiver_name = models.CharField(max_length=255)
    receiver_phone = models.CharField(max_length=20)
    address = models.TextField()

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer_addresses"
        verbose_name = "Customer Address"
        verbose_name_plural = "Customer Addresses"
        ordering = ["-is_default", "-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer"],
                condition=Q(is_default=True),
                name="unique_default_customer_address",
            )
        ]

    def __str__(self):
        return f"{self.receiver_name} - {self.receiver_phone}"

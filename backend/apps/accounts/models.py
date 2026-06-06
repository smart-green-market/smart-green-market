from django.db import models

from django.contrib.auth.models import AbstractUser


class AccountRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    SUPPLIER = "supplier", "Supplier"
    DEALER = "dealer", "Dealer"
    BUYER = "buyer", "Buyer"


class AccountStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    BANNED = "banned", "Banned"
    PENDING = "pending","Pending"


class Account(AbstractUser):
    # AbstractAccount đã có: Accountname, email, password (hash), is_active, ...
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.URLField(max_length=500, blank=True)  # hoặc ImageField

    role = models.CharField(
        max_length=20,
        choices=AccountRole.choices,
        default=AccountRole.BUYER,
    )
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)  # soft delete

    class Meta:
        db_table = "Accounts"

    def __str__(self):
        return self.username

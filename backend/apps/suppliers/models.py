"""Mô hình dữ liệu nhà cung cấp."""

from django.conf import settings
from django.db import models


class SupplierVerificationStatus(models.TextChoices):
    """Trạng thái duyệt hồ sơ nhà cung cấp."""

    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class Supplier(models.Model):
    """Hồ sơ nhà cung cấp gắn một-một với tài khoản người dùng."""

    account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="supplier_profile",
    )
    company_name = models.CharField(max_length=255)
    tax_code = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    description = models.TextField(blank=True)

    bank_name = models.CharField(max_length=255, blank=True)
    bank_bin = models.CharField(
        max_length=6,
        blank=True,
        help_text="Mã BIN Napas 6 số (vd. Vietcombank=970436) — dùng sinh VietQR",
    )
    account_number = models.CharField(max_length=50, blank=True)
    account_name = models.CharField(max_length=255, blank=True)

    verification_status = models.CharField(
        max_length=20,
        choices=SupplierVerificationStatus.choices,
        default=SupplierVerificationStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_suppliers",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Cấu hình bảng supplier và thứ tự mặc định."""

        db_table = "supplier"
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        """Trả về tên công ty để hiển thị."""
        return self.company_name

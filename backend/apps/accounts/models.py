"""Mô hình dữ liệu tài khoản người dùng và theo dõi đăng nhập thất bại."""

from django.db import models

from django.contrib.auth.models import AbstractUser


class AccountRole(models.TextChoices):
    """Các vai trò người dùng trong hệ thống."""

    ADMIN = "admin", "Admin"
    SUPPLIER = "supplier", "Supplier"
    DEALER = "dealer", "Dealer"
    BUYER = "buyer", "Buyer"


class AccountStatus(models.TextChoices):
    """Các trạng thái hoạt động của tài khoản."""

    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    BANNED = "banned", "Banned"
    PENDING = "pending","Pending"


class Account(AbstractUser):
    """Mô hình tài khoản người dùng mở rộng từ AbstractUser."""

    # AbstractAccount đã có: Accountname, email, password (hash), is_active, ...
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.FileField(upload_to="avatars/", blank=True, null=True)

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
        """Cấu hình bảng dữ liệu Accounts."""

        db_table = "Accounts"

    def __str__(self):
        """Trả về tên đăng nhập để hiển thị."""
        return self.username


class AccountDocumentType(models.TextChoices):
    """Các loại giấy tờ xác minh bắt buộc của supplier/dealer."""

    BUSINESS_LICENSE = "business_license", "Giấy phép kinh doanh"
    ID_CARD = "id_card", "CMND/CCCD"
    TAX_CERTIFICATE = "tax_certificate", "Giấy chứng nhận thuế"


class AccountDocumentStatus(models.TextChoices):
    """Trạng thái duyệt từng giấy tờ tài khoản."""

    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class AccountDocument(models.Model):
    """Giấy tờ xác minh gắn với tài khoản — dùng chung cho supplier và dealer."""

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_type = models.CharField(
        max_length=30,
        choices=AccountDocumentType.choices,
    )
    file_url = models.FileField(upload_to="documents/")

    status = models.CharField(
        max_length=20,
        choices=AccountDocumentStatus.choices,
        default=AccountDocumentStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_account_documents",
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "account_documents"
        verbose_name = "Account Document"
        verbose_name_plural = "Account Documents"
        ordering = ["document_type", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["account", "document_type"],
                name="unique_account_document_type",
            )
        ]

    def __str__(self):
        return f"{self.account.username} - {self.document_type}"


class LoginAttempt(models.Model):
    """Theo dõi số lần đăng nhập sai và thời điểm khóa tạm thời theo username."""

    username = models.CharField(max_length=150, unique=True)
    failed_count = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Cấu hình bảng dữ liệu login_attempts."""

        db_table = "login_attempts"

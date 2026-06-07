from django.conf import settings
from django.db import models


class SupplierVerificationStatus(models.TextChoices):
    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class SupplierDocumentType(models.TextChoices):
    BUSINESS_LICENSE = "business_license", "Giấy phép kinh doanh"
    ID_CARD = "id_card", "CMND/CCCD"
    TAX_CERTIFICATE = "tax_certificate", "Giấy chứng nhận thuế"


class SupplierDocumentStatus(models.TextChoices):
    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class Supplier(models.Model):
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
        db_table = "supplier"
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.company_name


class SupplierDocument(models.Model):
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_type = models.CharField(
        max_length=30,
        choices=SupplierDocumentType.choices,
    )
    file_url = models.FileField(upload_to="documents/")

    status = models.CharField(
        max_length=20,
        choices=SupplierDocumentStatus.choices,
        default=SupplierDocumentStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_supplier_documents",
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "supplier_document"
        verbose_name = "Supplier Document"
        verbose_name_plural = "Supplier Documents"
        ordering = ["document_type", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["supplier", "document_type"],
                name="unique_supplier_document_type",
            )
        ]

    def __str__(self):
        return f"{self.supplier.company_name} - {self.document_type}"

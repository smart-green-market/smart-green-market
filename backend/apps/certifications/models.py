from django.conf import settings
from django.db import models


class CertificationStatus(models.TextChoices):
    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"
    EXPIRED = "expired", "Hết hạn"
    REVOKED = "revoked", "Thu hồi"


class CertificationAuditAction(models.TextChoices):
    SUBMITTED = "submitted", "Nộp mới"
    APPROVED = "approved", "Duyệt"
    REJECTED = "rejected", "Từ chối"
    REVOKED = "revoked", "Thu hồi"
    EXPIRED = "expired", "Hết hạn"


class Certification(models.Model):
    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.CASCADE,
        related_name="certifications",
    )

    name = models.CharField(max_length=255)
    certificate_code = models.CharField(max_length=100)
    issued_by = models.CharField(max_length=255)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=CertificationStatus.choices,
        default=CertificationStatus.PENDING,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_certifications",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revoked_certifications",
    )
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "certifications"
        ordering = ["-created_at"]

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expiry_date < timezone.localdate()


class CertificationImage(models.Model):
    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image_url = models.FileField(upload_to="certifications/")
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "certification_images"
        ordering = ["sort_order", "id"]


class CertificationAuditLog(models.Model):
    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20, choices=CertificationAuditAction.choices)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "certification_audit_logs"
        ordering = ["-created_at"]


class SupplierProductCertification(models.Model):
    supplier_product = models.ForeignKey(
        "supplier_products.SupplierProduct",
        on_delete=models.CASCADE,
        related_name="product_certifications",
    )
    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name="certified_products",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "supplier_product_certifications"

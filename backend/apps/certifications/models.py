from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings


class CertificationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class Certification(models.Model):
    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.CASCADE,
        related_name="certifications"
    )

    name = models.CharField(max_length=255)
    certificate_code = models.CharField(max_length=100)

    issued_by = models.CharField(max_length=255)

    issue_date = models.DateField()
    expiry_date = models.DateField()

    description = models.TextField(blank=True)
    file_url = models.URLField(max_length=500)

    status = models.CharField(
        max_length=20,
        choices=CertificationStatus.choices,
        default=CertificationStatus.PENDING
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_certifications"
    )

    verified_at = models.DateTimeField(null=True, blank=True)

    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "certifications"
        
class SupplierProductCertification(models.Model):

    supplier_product = models.ForeignKey(
        "supplier_products.SupplierProduct",
        on_delete=models.CASCADE,
        related_name="product_certifications"
    )

    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name="certified_products"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "supplier_product_certifications"
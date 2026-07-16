"""Tests chứng nhận trên API chi tiết sản phẩm storefront."""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.certifications.models import (
    Certification,
    CertificationStatus,
    SupplierProductCertification,
)
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class StorefrontProductCertificationsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        dealer_account = Account.objects.create_user(
            username="dealer_sf_cert",
            email="dealer_sf_cert@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_sf_cert",
            email="supplier_sf_cert@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store SF Cert",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC SF Cert",
            tax_code="0123456790",
            phone="0900000004",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Trai cay",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Tao organic",
            slug="tao-organic-sf",
            unit="kg",
            wholesale_price="20000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.supplier_product,
            title="Tao organic tuoi",
            retail_price="35000.00",
            status=DealerProductStatus.ACTIVE,
        )
        today = timezone.localdate()
        self.approved_cert = Certification.objects.create(
            supplier=self.supplier,
            name="VietGAP",
            certificate_code="VG-001",
            issued_by="Bo NNPTNT",
            issue_date=today - timedelta(days=30),
            expiry_date=today + timedelta(days=365),
            status=CertificationStatus.APPROVED,
        )
        self.pending_cert = Certification.objects.create(
            supplier=self.supplier,
            name="Pending Cert",
            certificate_code="PEND-001",
            issued_by="Test",
            issue_date=today,
            expiry_date=today + timedelta(days=100),
            status=CertificationStatus.PENDING,
        )
        SupplierProductCertification.objects.create(
            supplier_product=self.supplier_product,
            certification=self.approved_cert,
        )
        SupplierProductCertification.objects.create(
            supplier_product=self.supplier_product,
            certification=self.pending_cert,
        )

    def test_detail_returns_only_approved_certifications(self):
        url = f"/api/storefronts/{self.dealer.slug}/products/{self.product.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        certifications = response.data["certifications"]
        self.assertEqual(len(certifications), 1)
        self.assertEqual(certifications[0]["name"], "VietGAP")
        self.assertEqual(certifications[0]["certificate_code"], "VG-001")
        self.assertIn("is_expired", certifications[0])
        self.assertIn("images", certifications[0])

    def test_detail_empty_certifications_when_none_linked(self):
        other_supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Buoi",
            slug="buoi-sf",
            unit="kg",
            wholesale_price="15000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        other_product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=other_supplier_product,
            title="Buoi tuoi",
            retail_price="25000.00",
            status=DealerProductStatus.ACTIVE,
        )

        url = f"/api/storefronts/{self.dealer.slug}/products/{other_product.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["certifications"], [])

    def test_list_does_not_include_certifications(self):
        url = f"/api/storefronts/{self.dealer.slug}/products/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", response.data)
        product_row = next(row for row in results if row["id"] == self.product.id)
        self.assertNotIn("certifications", product_row)

"""Tests API gợi ý sản phẩm liên quan — storefront và dealer."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.models import (
    DealerProduct,
    DealerProductRelatedRecommendation,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class RelatedRecommendationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dealer_account = Account.objects.create_user(
            username="dealer_rec_api",
            email="dealer_rec_api@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_rec_api",
            email="supplier_rec_api@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=self.dealer_account,
            store_name="Store Rec",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Rec",
            tax_code="0123456788",
            phone="0900000003",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.other_category = Category.objects.create(
            name="Củ",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Rau muống",
            slug="rau-muong-rec",
            unit="bó",
            wholesale_price=Decimal("8000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.other_supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.other_category,
            name="Khoai lang",
            slug="khoai-lang-rec",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.product_a = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.supplier_product,
            category=self.category,
            title="Rau A",
            retail_price=Decimal("12000.00"),
            status=DealerProductStatus.ACTIVE,
        )
        self.product_b = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.other_supplier_product,
            category=self.other_category,
            title="Khoai B",
            retail_price=Decimal("15000.00"),
            status=DealerProductStatus.ACTIVE,
        )
        self.product_c = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.supplier_product,
            category=self.category,
            title="Rau C",
            retail_price=Decimal("13000.00"),
            status=DealerProductStatus.ACTIVE,
        )
        DealerProductRelatedRecommendation.objects.create(
            dealer_product=self.product_a,
            related_product_ids=[self.product_b.id, self.product_c.id],
        )

    def test_storefront_related_products_uses_configured_ids(self):
        url = f"/api/storefronts/{self.dealer.slug}/products/{self.product_a.id}/related/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data]
        self.assertEqual(ids, [self.product_b.id, self.product_c.id])

    def test_storefront_related_products_fallback_same_category(self):
        url = f"/api/storefronts/{self.dealer.slug}/products/{self.product_c.id}/related/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data]
        self.assertIn(self.product_a.id, ids)
        self.assertNotIn(self.product_c.id, ids)

    def test_dealer_list_related_recommendations(self):
        self.client.force_authenticate(user=self.dealer_account)
        response = self.client.get("/api/dealer-product-related-recommendations/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["related_product_ids"],
            [self.product_b.id, self.product_c.id],
        )

    def test_dealer_get_related_recommendation_by_product(self):
        self.client.force_authenticate(user=self.dealer_account)
        url = f"/api/dealer-products/{self.product_a.id}/related-recommendation/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["related_product_ids"], [self.product_b.id, self.product_c.id])
        self.assertIsNotNone(response.data["updated_at"])

    def test_dealer_get_related_recommendation_empty_when_missing(self):
        self.client.force_authenticate(user=self.dealer_account)
        url = f"/api/dealer-products/{self.product_b.id}/related-recommendation/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["related_product_ids"], [])
        self.assertIsNone(response.data["updated_at"])

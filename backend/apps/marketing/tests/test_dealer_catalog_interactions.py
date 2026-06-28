"""Tests ghi nhận tương tác đại lý trên catalog NCC."""

from datetime import timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.marketing.dealer_catalog_services import (
    track_dealer_catalog_interaction,
    track_purchase_interactions_for_purchase_orders,
)
from apps.marketing.interaction_core import POINTS_ADD_CART, POINTS_VIEW
from apps.marketing.models import DealerSupplierProductInteraction
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


def _interaction(**kwargs):
    defaults = {
        "view_count": 0,
        "add_cart_count": 0,
        "purchase_count": 0,
        "last_viewed_at": None,
        "last_added_at": None,
        "last_purchased_at": None,
        "supplier_id": 1,
        "save": Mock(),
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


class TrackDealerCatalogInteractionTests(SimpleTestCase):
    @patch("apps.marketing.dealer_catalog_services._get_or_create_interaction")
    @patch("apps.marketing.dealer_catalog_services.resolve_dealer_catalog_supplier_product")
    def test_records_view(self, _mock_product, mock_get):
        interaction = _interaction()
        mock_get.return_value = interaction

        result = track_dealer_catalog_interaction(
            dealer=Mock(),
            supplier=Mock(id=1),
            supplier_product_id=5,
            action="view",
        )

        self.assertTrue(result.recorded)
        self.assertEqual(result.view_count, 1)
        self.assertEqual(result.engagement_score, POINTS_VIEW)


class TrackDealerCatalogPurchaseTests(SimpleTestCase):
    @patch("apps.marketing.dealer_catalog_services._get_or_create_interaction")
    def test_increments_once_per_product(self, mock_get):
        product_a = SimpleNamespace(id=1, supplier=SimpleNamespace(id=10))
        product_b = SimpleNamespace(id=2, supplier=SimpleNamespace(id=20))
        interaction_a = _interaction()
        interaction_b = _interaction()
        mock_get.side_effect = [interaction_a, interaction_b]

        track_purchase_interactions_for_purchase_orders(
            dealer=Mock(),
            items_data=[
                {"supplier_product": product_a, "quantity": Decimal("5")},
                {"supplier_product": product_a, "quantity": Decimal("3")},
                {"supplier_product": product_b, "quantity": Decimal("1")},
            ],
        )

        self.assertEqual(interaction_a.purchase_count, 1)
        self.assertEqual(interaction_b.purchase_count, 1)


class DealerCatalogInteractionApiTests(TestCase):
    def setUp(self):
        self.dealer_account = Account.objects.create_user(
            username="dealer_int",
            email="dealer_int@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=self.dealer_account,
            store_name="Store Int",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="sup_int",
            email="sup_int@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Int",
            tax_code="6666666666",
            phone="0900000006",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau Int",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Cà chua Int",
            slug="ca-chua-int",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )

    def test_api_track_view(self):
        client = APIClient()
        client.force_authenticate(user=self.dealer_account)
        response = client.post(
            f"/api/suppliers/{self.supplier.id}/interactions/",
            {"supplier_product_id": self.product.id, "action": "view"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["recorded"])
        row = DealerSupplierProductInteraction.objects.get(
            dealer=self.dealer,
            supplier_product=self.product,
        )
        self.assertEqual(row.view_count, 1)

    def test_api_debounce_view(self):
        client = APIClient()
        client.force_authenticate(user=self.dealer_account)
        url = f"/api/suppliers/{self.supplier.id}/interactions/"
        client.post(url, {"supplier_product_id": self.product.id, "action": "view"}, format="json")
        response = client.post(
            url,
            {"supplier_product_id": self.product.id, "action": "view"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["recorded"])
        self.assertEqual(response.data["reason"], "view_debounced")

    def test_purchase_hook_on_create_po(self):
        from apps.purchase_orders.services import create_purchase_orders

        create_purchase_orders(
            dealer_profile=self.dealer,
            delivery_data={
                "delivery_address": "Addr",
                "requested_delivery_time": timezone.now() + timedelta(days=3),
                "receiver_name": "A",
                "receiver_phone": "090",
                "note": "",
            },
            items_data=[
                {
                    "supplier_product": self.product,
                    "quantity": Decimal("50"),
                    "note": "",
                }
            ],
            user=self.dealer_account,
        )
        row = DealerSupplierProductInteraction.objects.get(
            dealer=self.dealer,
            supplier_product=self.product,
        )
        self.assertEqual(row.purchase_count, 1)

"""Tests ngày giao NCC cam kết khi confirm phiếu nhập."""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.notifications.models import Notification, NotificationReceipt
from apps.purchase_orders.models import PurchaseOrderStatus
from apps.purchase_orders.services import create_purchase_order, supplier_confirm_order
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from common.business_rules import validate_confirmed_delivery_time


class ConfirmedDeliveryTimeTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_po_del",
            email="dealer_po_del@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_po_del",
            email="supplier_po_del@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store PO Del",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC PO Del",
            tax_code="0123456799",
            phone="0900000099",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau PO",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Rau muong PO",
            slug="rau-muong-po-del",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.requested_time = timezone.now() + timedelta(days=10)
        delivery_data = {
            "delivery_address": "Kho dealer",
            "requested_delivery_time": self.requested_time,
            "receiver_name": "Dealer User",
            "receiver_phone": "0901111222",
            "note": "",
        }
        self.order = create_purchase_order(
            dealer_profile=self.dealer,
            supplier=self.supplier,
            delivery_data=delivery_data,
            items_data=[
                {
                    "supplier_product": self.supplier_product,
                    "quantity": Decimal("100"),
                    "note": "",
                }
            ],
            user=dealer_account,
        )

    def test_confirm_with_earlier_delivery_succeeds(self):
        confirmed = timezone.now() + timedelta(days=3)
        supplier_confirm_order(
            self.order,
            self.supplier.account,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=confirmed,
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.CONFIRMED)
        self.assertEqual(self.order.confirmed_delivery_time, confirmed)

    def test_confirm_too_late_fails(self):
        too_late = self.requested_time + timedelta(days=8)
        with self.assertRaises(ValidationError):
            validate_confirmed_delivery_time(self.order, too_late)

    def test_confirm_too_early_fails(self):
        too_early = timezone.now() + timedelta(hours=1)
        with self.assertRaises(ValidationError):
            validate_confirmed_delivery_time(self.order, too_early)

    def test_notify_dealer_when_delivery_adjusted(self):
        confirmed = timezone.now() + timedelta(days=4)
        supplier_confirm_order(
            self.order,
            self.supplier.account,
            confirmed_delivery_time=confirmed,
        )
        self.assertTrue(
            NotificationReceipt.objects.filter(
                account=self.dealer.account,
                notification__reference_type="purchase_order",
                notification__reference_id=self.order.id,
                notification__title__icontains="Lịch giao đã điều chỉnh",
            ).exists()
        )

    def test_no_extra_notify_when_same_as_requested(self):
        supplier_confirm_order(
            self.order,
            self.supplier.account,
            confirmed_delivery_time=self.requested_time,
        )
        self.assertEqual(
            NotificationReceipt.objects.filter(
                account=self.dealer.account,
                notification__reference_type="purchase_order",
                notification__reference_id=self.order.id,
                notification__title__icontains="Lịch giao đã điều chỉnh",
            ).count(),
            0,
        )


class ConfirmedDeliveryApiTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_po_api",
            email="dealer_po_api@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_po_api",
            email="supplier_po_api@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store PO API",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC PO API",
            tax_code="0123456798",
            phone="0900000098",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau API",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        sp = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="SP API",
            slug="sp-api-po-del",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.requested_time = timezone.now() + timedelta(days=10)
        self.order = create_purchase_order(
            dealer_profile=self.dealer,
            supplier=self.supplier,
            delivery_data={
                "delivery_address": "Kho",
                "requested_delivery_time": self.requested_time,
                "receiver_name": "A",
                "receiver_phone": "090",
                "note": "",
            },
            items_data=[{"supplier_product": sp, "quantity": Decimal("50"), "note": ""}],
            user=dealer_account,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=supplier_account)

    def test_api_confirm_requires_confirmed_delivery_time(self):
        response = self.client.post(
            f"/api/purchase-orders/{self.order.id}/confirm/",
            {"deposit_percent": "30"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        errors = response.data.get("errors") or response.data
        self.assertIn("confirmed_delivery_time", errors)

    def test_api_confirm_success(self):
        confirmed = (timezone.now() + timedelta(days=5)).isoformat()
        response = self.client.post(
            f"/api/purchase-orders/{self.order.id}/confirm/",
            {
                "deposit_percent": "30",
                "confirmed_delivery_time": confirmed,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data["confirmed_delivery_time"])

    def test_purchase_order_config_includes_max_delay(self):
        response = APIClient().get("/api/purchase-order-config/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("max_delivery_delay_days", response.data)
        self.assertEqual(response.data["max_delivery_delay_days"], 7)

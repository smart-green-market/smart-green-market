"""Tests GET /api/dealer-products/waiting-stock/."""

from datetime import date, datetime
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerAddress, CustomerProfile
from apps.dealer_products.canonical_inventory import CANONICAL_BATCH_NUMBER
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.orders.delivery_slots import VN_TZ, resolve_delivery_time
from apps.orders import preorder_services
from apps.orders.models import Order, OrderStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class DealerProductWaitingStockApiTests(TestCase):
    FIXED_NOW = datetime(2026, 6, 21, 8, 0, tzinfo=VN_TZ)

    def setUp(self):
        self.now_patcher = patch.object(timezone, "now", return_value=self.FIXED_NOW)
        self.now_patcher.start()
        self.addCleanup(self.now_patcher.stop)

        self.push_patcher = patch("common.notifications.push_notification_to_account")
        self.push_patcher.start()
        self.addCleanup(self.push_patcher.stop)

        self.delivery_time = resolve_delivery_time(date(2026, 6, 22), "morning")

        self.dealer_account = Account.objects.create_user(
            username="dealer_ws",
            email="dealer_ws@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=self.dealer_account,
            store_name="Store WS",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        other_dealer_account = Account.objects.create_user(
            username="dealer_ws2",
            email="dealer_ws2@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.other_dealer = DealerProfile.objects.create(
            account=other_dealer_account,
            store_name="Store WS2",
            store_address="Addr2",
            status=DealerProfileStatus.ACTIVE,
        )

        buyer_account = Account.objects.create_user(
            username="buyer_ws",
            email="buyer_ws@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.customer = CustomerProfile.objects.create(user=buyer_account)
        self.buyer_user = buyer_account
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            receiver_name="Buyer WS",
            receiver_phone="0900111222",
            address="123 Test St",
            is_default=True,
        )

        supplier_account = Account.objects.create_user(
            username="sup_ws",
            email="sup_ws@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC WS",
            tax_code="8888888888",
            phone="0900000008",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau WS",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Rau WS",
            slug="rau-ws",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.product_waiting = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Rau chờ hàng",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        self.product_no_waiting = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Rau không chờ",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        DealerInventoryBatch.objects.create(
            dealer_product=self.product_waiting,
            batch_number=CANONICAL_BATCH_NUMBER,
            quantity=5,
            remaining_quantity=5,
            import_price="10000.00",
            import_date=self.FIXED_NOW.date(),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

        self.client = APIClient()

    def _create_waiting_order(self, *, product, quantity=20):
        preorder = preorder_services.create_preorder_request(
            dealer=self.dealer,
            customer=self.customer,
            customer_address_id=self.address.id,
            delivery_time=self.delivery_time,
            note="YC WS",
            items_data=[{"dealer_product": product, "quantity": quantity}],
            user=self.buyer_user,
        )
        preorder_services.dealer_confirm_preorder(preorder, self.dealer_account)
        preorder.refresh_from_db()
        return preorder.converted_order

    def test_dealer_lists_only_products_with_waiting_stock_orders(self):
        self._create_waiting_order(product=self.product_waiting, quantity=20)
        self.client.force_authenticate(user=self.dealer_account)
        response = self.client.get("/api/dealer-products/waiting-stock/")
        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.data["results"]}
        self.assertEqual(ids, {self.product_waiting.id})
        row = response.data["results"][0]
        self.assertEqual(row["waiting_stock_quantity"], 20)
        self.assertEqual(row["waiting_stock_order_count"], 1)
        self.assertEqual(row["available_quantity"], 5)
        self.assertEqual(response.data["summary"]["waiting_stock_order_count"], 1)
        self.assertEqual(
            response.data["summary"]["waiting_stock_line_quantity_total"],
            20,
        )

    def test_available_quantity_not_inflated_by_multiple_waiting_orders(self):
        """Regression: stock annotate must not join with order_items rows."""
        self._create_waiting_order(product=self.product_waiting, quantity=10)
        self._create_waiting_order(product=self.product_waiting, quantity=15)
        self.client.force_authenticate(user=self.dealer_account)
        waiting_resp = self.client.get("/api/dealer-products/waiting-stock/")
        list_resp = self.client.get("/api/dealer-products/")
        self.assertEqual(waiting_resp.status_code, 200)
        row = waiting_resp.data["results"][0]
        self.assertEqual(row["waiting_stock_quantity"], 25)
        self.assertEqual(row["waiting_stock_order_count"], 2)
        self.assertEqual(row["available_quantity"], 5)
        catalog_row = next(
            r for r in list_resp.data["results"] if r["id"] == self.product_waiting.id
        )
        self.assertEqual(row["available_quantity"], catalog_row["available_quantity"])

    def test_excludes_orders_not_waiting_stock(self):
        self._create_waiting_order(product=self.product_waiting, quantity=10)
        order = Order.objects.get(dealer=self.dealer, status=OrderStatus.WAITING_STOCK)
        order.status = OrderStatus.PROCESSING
        order.save(update_fields=["status"])
        self.client.force_authenticate(user=self.dealer_account)
        response = self.client.get("/api/dealer-products/waiting-stock/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])
        self.assertEqual(response.data["summary"]["waiting_stock_order_count"], 0)

    def test_buyer_forbidden(self):
        self.client.force_authenticate(user=self.buyer_user)
        response = self.client.get("/api/dealer-products/waiting-stock/")
        self.assertEqual(response.status_code, 403)

    def test_other_dealer_does_not_see_products(self):
        self._create_waiting_order(product=self.product_waiting, quantity=15)
        self.client.force_authenticate(user=self.other_dealer.account)
        response = self.client.get("/api/dealer-products/waiting-stock/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])
        self.assertEqual(response.data["summary"]["waiting_stock_order_count"], 0)

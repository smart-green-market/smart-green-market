"""Tests soft-delete sản phẩm đại lý."""

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerProfile
from apps.dealer_products.archive import soft_delete_dealer_product
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class DealerProductSoftDeleteTests(TestCase):
    def setUp(self):
        self.dealer_account = Account.objects.create_user(
            username="dealer_sd2",
            email="dealer_sd2@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=self.dealer_account,
            store_name="Store SD2",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="sup_sd2",
            email="sup_sd2@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC SD2",
            tax_code="2222222222",
            phone="0900000002",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau SD2",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Cà chua SD2",
            slug="ca-chua-sd2",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Cà chua bán lẻ SD2",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        self.batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="B-SD2",
            quantity=50,
            remaining_quantity=0,
            import_price="10000.00",
            import_date=timezone.localdate(),
            status=DealerInventoryBatchStatus.DEPLETED,
        )
        buyer_account = Account.objects.create_user(
            username="buyer_sd2",
            email="buyer_sd2@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.customer = CustomerProfile.objects.create(user=buyer_account)

    def test_soft_delete_success_no_stock_no_orders(self):
        soft_delete_dealer_product(self.product, self.dealer_account)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, DealerProductStatus.DELETED)

    def test_blocked_by_remaining_inventory(self):
        self.batch.remaining_quantity = 10
        self.batch.status = DealerInventoryBatchStatus.ACTIVE
        self.batch.save(update_fields=["remaining_quantity", "status"])
        with self.assertRaises(ValidationError) as ctx:
            soft_delete_dealer_product(self.product, self.dealer_account)
        self.assertEqual(ctx.exception.detail["code"], "has_inventory_remaining")
        self.assertEqual(int(ctx.exception.detail["remaining_quantity"]), 10)

    def test_blocked_by_open_customer_order(self):
        order = Order.objects.create(
            order_code="ORD-SD2-001",
            customer=self.customer,
            dealer=self.dealer,
            status=OrderStatus.PENDING,
            receiver_name="Buyer",
            receiver_phone="091",
            delivery_address="Addr",
            delivery_time=timezone.now(),
        )
        OrderItem.objects.create(
            order=order,
            dealer_product=self.product,
            batch=self.batch,
            product_title=self.product.title,
            unit="kg",
            quantity=1,
            unit_price="15000.00",
            subtotal="15000.00",
        )
        with self.assertRaises(ValidationError) as ctx:
            soft_delete_dealer_product(self.product, self.dealer_account)
        self.assertEqual(ctx.exception.detail["code"], "has_open_customer_orders")

    def test_allowed_when_order_completed(self):
        order = Order.objects.create(
            order_code="ORD-SD2-002",
            customer=self.customer,
            dealer=self.dealer,
            status=OrderStatus.COMPLETED,
            receiver_name="Buyer",
            receiver_phone="091",
            delivery_address="Addr",
            delivery_time=timezone.now(),
        )
        OrderItem.objects.create(
            order=order,
            dealer_product=self.product,
            batch=self.batch,
            product_title=self.product.title,
            unit="kg",
            quantity=1,
            unit_price="15000.00",
            subtotal="15000.00",
        )
        soft_delete_dealer_product(self.product, self.dealer_account)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, DealerProductStatus.DELETED)

    def test_api_destroy_by_admin(self):
        admin = Account.objects.create_user(
            username="admin_sd2",
            email="admin_sd2@test.com",
            password="pass",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.delete(f"/api/dealer-products/{self.product.id}/")
        self.assertEqual(response.status_code, 204)

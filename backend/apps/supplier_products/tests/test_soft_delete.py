"""Tests soft-delete sản phẩm NCC."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from apps.supplier_products.archive import soft_delete_supplier_product
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class SupplierProductSoftDeleteTests(TestCase):
    def setUp(self):
        self.supplier_account = Account.objects.create_user(
            username="sup_sd",
            email="sup_sd@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=self.supplier_account,
            company_name="NCC SD",
            tax_code="1111111111",
            phone="0900000001",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau SD",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Cà chua SD",
            slug="ca-chua-sd",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        dealer_account = Account.objects.create_user(
            username="dealer_sd",
            email="dealer_sd@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store SD",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )

    def test_soft_delete_success(self):
        soft_delete_supplier_product(self.product, self.supplier_account)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, SupplierProductStatus.DELETED)

    def test_soft_delete_idempotent(self):
        self.product.status = SupplierProductStatus.DELETED
        self.product.save(update_fields=["status"])
        soft_delete_supplier_product(self.product, self.supplier_account)
        self.assertEqual(self.product.status, SupplierProductStatus.DELETED)

    def test_blocked_by_active_purchase_order(self):
        po = PurchaseOrder.objects.create(
            order_code="PO-SD-001",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.CONFIRMED,
            delivery_address="Addr",
            requested_delivery_time=timezone.now(),
            receiver_name="A",
            receiver_phone="090",
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            supplier_product=self.product,
            quantity=Decimal("10"),
            original_quantity=Decimal("10"),
            unit_price=Decimal("10000"),
            subtotal=Decimal("100000"),
        )
        with self.assertRaises(ValidationError) as ctx:
            soft_delete_supplier_product(self.product, self.supplier_account)
        self.assertEqual(ctx.exception.detail["code"], "has_active_purchase_orders")
        self.assertEqual(int(ctx.exception.detail["active_purchase_orders"]), 1)

    def test_allowed_when_po_terminal(self):
        po = PurchaseOrder.objects.create(
            order_code="PO-SD-002",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=timezone.now(),
            receiver_name="A",
            receiver_phone="090",
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            supplier_product=self.product,
            quantity=Decimal("10"),
            original_quantity=Decimal("10"),
            unit_price=Decimal("10000"),
            subtotal=Decimal("100000"),
        )
        soft_delete_supplier_product(self.product, self.supplier_account)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, SupplierProductStatus.DELETED)

    def test_blocked_by_dealer_product(self):
        DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.product,
            title="Bán lẻ",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        with self.assertRaises(ValidationError) as ctx:
            soft_delete_supplier_product(self.product, self.supplier_account)
        self.assertEqual(ctx.exception.detail["code"], "has_dealer_products")

    def test_api_destroy_returns_204(self):
        client = APIClient()
        client.force_authenticate(user=self.supplier_account)
        response = client.delete(f"/api/supplier-products/{self.product.id}/")
        self.assertEqual(response.status_code, 204)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, SupplierProductStatus.DELETED)

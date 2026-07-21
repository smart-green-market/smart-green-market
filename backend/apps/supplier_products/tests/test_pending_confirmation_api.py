"""Tests GET /api/supplier-products/pending-confirmation/."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class SupplierProductPendingConfirmationApiTests(TestCase):
    def setUp(self):
        self.supplier_account = Account.objects.create_user(
            username="sup_pc",
            email="sup_pc@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=self.supplier_account,
            company_name="NCC PC",
            tax_code="6666666666",
            phone="0900000006",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.other_supplier_account = Account.objects.create_user(
            username="sup_pc2",
            email="sup_pc2@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.other_supplier = Supplier.objects.create(
            account=self.other_supplier_account,
            company_name="NCC PC2",
            tax_code="7777777777",
            phone="0900000007",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        dealer_account = Account.objects.create_user(
            username="dealer_pc",
            email="dealer_pc@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store PC",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        category = Category.objects.create(
            name="Rau PC",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product_pending = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Cà chua PC",
            slug="ca-chua-pc",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.product_prep_only = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Dưa leo PC",
            slug="dua-leo-pc",
            unit="kg",
            wholesale_price="8000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        now = timezone.now()

        po_pending = PurchaseOrder.objects.create(
            order_code="PO-PC-PENDING",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
            delivery_address="Addr",
            requested_delivery_time=now,
            receiver_name="A",
            receiver_phone="090",
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po_pending,
            supplier_product=self.product_pending,
            quantity=Decimal("30"),
            original_quantity=Decimal("30"),
            unit_price=Decimal("10000"),
            base_unit_price=Decimal("10000"),
            subtotal=Decimal("300000"),
        )

        po_prep = PurchaseOrder.objects.create(
            order_code="PO-PC-PREP",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.PROCESSING,
            delivery_address="Addr",
            requested_delivery_time=now,
            receiver_name="B",
            receiver_phone="091",
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po_prep,
            supplier_product=self.product_prep_only,
            quantity=Decimal("50"),
            original_quantity=Decimal("50"),
            unit_price=Decimal("8000"),
            base_unit_price=Decimal("8000"),
            subtotal=Decimal("400000"),
        )

        self.client = APIClient()

    def test_supplier_lists_only_products_with_pending_confirmation(self):
        self.client.force_authenticate(user=self.supplier_account)
        response = self.client.get("/api/supplier-products/pending-confirmation/")
        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.data["results"]}
        self.assertEqual(ids, {self.product_pending.id})
        row = response.data["results"][0]
        self.assertEqual(Decimal(row["pending_order_quantity"]), Decimal("30"))
        self.assertEqual(row["pending_purchase_order_count"], 1)
        self.assertEqual(response.data["summary"]["pending_purchase_order_count"], 1)
        self.assertEqual(
            Decimal(response.data["summary"]["pending_line_quantity_total"]),
            Decimal("30"),
        )

    def test_dealer_forbidden(self):
        self.client.force_authenticate(user=self.dealer.account)
        response = self.client.get("/api/supplier-products/pending-confirmation/")
        self.assertEqual(response.status_code, 403)

    def test_other_supplier_does_not_see_products(self):
        self.client.force_authenticate(user=self.other_supplier_account)
        response = self.client.get("/api/supplier-products/pending-confirmation/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])
        self.assertEqual(response.data["summary"]["pending_purchase_order_count"], 0)

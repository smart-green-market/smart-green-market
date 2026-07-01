"""Tests tổng hợp SL đặt hàng trên sản phẩm NCC."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.supplier_products.order_demand import annotate_supplier_product_order_demand
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class SupplierProductOrderDemandTests(TestCase):
    def setUp(self):
        self.supplier_account = Account.objects.create_user(
            username="sup_od",
            email="sup_od@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=self.supplier_account,
            company_name="NCC OD",
            tax_code="5555555555",
            phone="0900000005",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        dealer_account = Account.objects.create_user(
            username="dealer_od",
            email="dealer_od@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store OD",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        category = Category.objects.create(
            name="Rau OD",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Cà chua OD",
            slug="ca-chua-od",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        now = timezone.now()

        po_pending = PurchaseOrder.objects.create(
            order_code="PO-OD-PENDING",
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
            supplier_product=self.product,
            quantity=Decimal("30"),
            original_quantity=Decimal("30"),
            unit_price=Decimal("10000"),
            subtotal=Decimal("300000"),
        )

        po_prep = PurchaseOrder.objects.create(
            order_code="PO-OD-PREP",
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
            supplier_product=self.product,
            quantity=Decimal("50"),
            original_quantity=Decimal("50"),
            unit_price=Decimal("10000"),
            subtotal=Decimal("500000"),
        )

        po_done = PurchaseOrder.objects.create(
            order_code="PO-OD-DONE",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=now,
            receiver_name="C",
            receiver_phone="092",
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po_done,
            supplier_product=self.product,
            quantity=Decimal("99"),
            original_quantity=Decimal("99"),
            unit_price=Decimal("10000"),
            subtotal=Decimal("990000"),
        )

    def test_annotate_pending_and_preparation_quantities(self):
        product = annotate_supplier_product_order_demand(
            SupplierProduct.objects.filter(pk=self.product.pk)
        ).get()
        self.assertEqual(product.pending_order_quantity, Decimal("30"))
        self.assertEqual(product.preparation_quantity, Decimal("50"))

    def test_list_api_includes_quantities_for_supplier(self):
        client = APIClient()
        client.force_authenticate(user=self.supplier_account)
        response = client.get("/api/supplier-products/")
        self.assertEqual(response.status_code, 200)
        row = next(r for r in response.data["results"] if r["id"] == self.product.id)
        self.assertEqual(Decimal(row["pending_order_quantity"]), Decimal("30"))
        self.assertEqual(Decimal(row["preparation_quantity"]), Decimal("50"))

    def test_detail_api_includes_purchase_orders(self):
        client = APIClient()
        client.force_authenticate(user=self.supplier_account)
        response = client.get(f"/api/supplier-products/{self.product.id}/")
        self.assertEqual(response.status_code, 200)
        codes = {row["order_code"] for row in response.data["purchase_orders"]}
        self.assertEqual(codes, {"PO-OD-PENDING", "PO-OD-PREP"})
        pending = next(
            r for r in response.data["purchase_orders"] if r["order_code"] == "PO-OD-PENDING"
        )
        self.assertEqual(Decimal(pending["quantity"]), Decimal("30"))
        self.assertEqual(pending["dealer_store_name"], "Store OD")

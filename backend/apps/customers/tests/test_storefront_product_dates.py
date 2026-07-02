"""Tests ngày sản xuất / hết hạn trên API chi tiết sản phẩm storefront."""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.inventory_expiry import compute_batch_production_date
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealer_products.services import annotate_dealer_product_stock
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class StorefrontProductDatesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        dealer_account = Account.objects.create_user(
            username="dealer_sf_dates",
            email="dealer_sf_dates@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_sf_dates",
            email="supplier_sf_dates@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store SF Dates",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC SF",
            tax_code="0123456789",
            phone="0900000002",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Rau muống",
            slug="rau-muong-sf",
            unit="bó",
            wholesale_price="8000.00",
            storage_duration_days=5,
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.supplier_product,
            title="Rau muống tươi",
            retail_price="12000.00",
            status=DealerProductStatus.ACTIVE,
        )
        self.today = timezone.localdate()

    def _create_batch(self, *, import_offset=0, expiry_offset=5, production_offset=0):
        import_date = self.today - timedelta(days=import_offset)
        production_date = self.today - timedelta(days=production_offset)
        expiry_date = self.today + timedelta(days=expiry_offset)
        return DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number=f"BATCH-{import_offset}",
            quantity=20,
            remaining_quantity=20,
            import_price="8000.00",
            import_date=import_date,
            production_date=production_date,
            expiry_date=expiry_date,
            status=DealerInventoryBatchStatus.ACTIVE,
        )

    def test_storefront_detail_returns_fifo_batch_dates(self):
        older = self._create_batch(import_offset=3, production_offset=3, expiry_offset=2)
        self._create_batch(import_offset=1, production_offset=1, expiry_offset=6)

        url = f"/api/storefronts/{self.dealer.slug}/products/{self.product.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["production_date"], older.production_date)
        self.assertEqual(response.data["expiry_date"], older.expiry_date)
        self.assertEqual(response.data["days_to_expiry"], 2)

    def test_storefront_detail_null_dates_when_out_of_stock(self):
        url = f"/api/storefronts/{self.dealer.slug}/products/{self.product.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["production_date"])
        self.assertIsNone(response.data["expiry_date"])
        self.assertIsNone(response.data["days_to_expiry"])

    def test_compute_batch_production_date_matches_expiry_minus_storage(self):
        import_date = self.today
        expiry = import_date + timedelta(days=5)
        production = compute_batch_production_date(
            import_date,
            self.supplier_product,
            expiry_date=expiry,
        )
        self.assertEqual(production, import_date)

    def test_import_sets_production_date_on_batch(self):
        from apps.purchase_orders.models import (
            PurchaseOrder,
            PurchaseOrderItem,
            PurchaseOrderStatus,
        )
        from apps.purchase_orders.services import _import_dealer_inventory

        order = PurchaseOrder.objects.create(
            order_code="PN-SF-DATES",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=timezone.now(),
            receiver_name="Dealer",
            receiver_phone="0900000000",
            total_amount=Decimal("100000"),
        )
        item = PurchaseOrderItem.objects.create(
            purchase_order=order,
            supplier_product=self.supplier_product,
            quantity=10,
            unit_price=Decimal("10000"),
            subtotal=Decimal("100000"),
        )
        _import_dealer_inventory(order, self.dealer.account)

        batch = DealerInventoryBatch.objects.get(purchase_order_item=item)
        import_date = timezone.localdate()
        self.assertEqual(batch.production_date, import_date)
        self.assertEqual(batch.expiry_date, import_date + timedelta(days=5))

        annotate_dealer_product_stock(DealerProduct.objects.filter(pk=self.product.pk))
        url = f"/api/storefronts/{self.dealer.slug}/products/{self.product.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["production_date"], import_date)
        self.assertEqual(response.data["expiry_date"], import_date + timedelta(days=5))

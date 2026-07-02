"""Tests ngày hết hạn lô tồn kho và đánh dấu expired."""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.inventory_expiry import (
    MAX_STORAGE_DURATION_DAYS,
    backfill_batch_expiry_dates,
    compute_batch_expiry_date,
    compute_batch_production_date,
    fix_invalid_supplier_storage_duration_days,
    mark_expired_inventory_batches,
    recompute_batch_expiry_date,
    set_batch_expiry_date,
)
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealer_products.services import annotate_dealer_product_stock
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from apps.purchase_orders.services import _import_dealer_inventory
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class InventoryExpiryTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_exp",
            email="dealer_exp@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_exp",
            email="supplier_exp@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Exp",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Exp",
            tax_code="0123456780",
            phone="0900000001",
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
            name="Cà chua",
            slug="ca-chua-exp",
            unit="kg",
            wholesale_price="10000.00",
            storage_duration_days=7,
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.supplier_product,
            title="Cà chua bán lẻ",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )

    def test_compute_batch_expiry_date_from_storage_days(self):
        import_date = timezone.localdate()
        expiry = compute_batch_expiry_date(import_date, self.supplier_product)
        self.assertEqual(expiry, import_date + timedelta(days=7))

    def test_compute_batch_expiry_date_none_when_no_storage_days(self):
        self.supplier_product.storage_duration_days = None
        import_date = timezone.localdate()
        self.assertIsNone(compute_batch_expiry_date(import_date, self.supplier_product))

    def test_compute_batch_expiry_date_none_when_storage_days_too_large(self):
        self.supplier_product.storage_duration_days = 2147483647
        import_date = timezone.localdate()
        self.assertIsNone(compute_batch_expiry_date(import_date, self.supplier_product))

    def test_import_dealer_inventory_sets_expiry_date(self):
        order = PurchaseOrder.objects.create(
            order_code="PN-TEST-001",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=timezone.now(),
            receiver_name="Dealer",
            receiver_phone="0900000000",
            total_amount=Decimal("500000"),
        )
        item = PurchaseOrderItem.objects.create(
            purchase_order=order,
            supplier_product=self.supplier_product,
            quantity=50,
            unit_price=Decimal("10000"),
            subtotal=Decimal("500000"),
        )
        import_date = timezone.localdate()
        _import_dealer_inventory(order, self.dealer.account)

        batch = DealerInventoryBatch.objects.get(purchase_order_item=item)
        self.assertEqual(batch.expiry_date, import_date + timedelta(days=7))
        self.assertEqual(batch.production_date, import_date)
        self.assertEqual(batch.status, DealerInventoryBatchStatus.ACTIVE)

    def test_compute_batch_production_date(self):
        import_date = timezone.localdate()
        expiry = import_date + timedelta(days=7)
        production = compute_batch_production_date(
            import_date,
            self.supplier_product,
            expiry_date=expiry,
        )
        self.assertEqual(production, import_date)

    def test_recompute_updates_production_date(self):
        today = timezone.localdate()
        batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="RECOMP-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=2),
            production_date=None,
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        recompute_batch_expiry_date(batch)
        batch.refresh_from_db()
        self.assertEqual(batch.expiry_date, today - timedelta(days=2) + timedelta(days=7))
        self.assertEqual(batch.production_date, today - timedelta(days=2))

    def test_manual_expiry_does_not_change_production_date(self):
        today = timezone.localdate()
        original_production = today - timedelta(days=5)
        batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="MANUAL-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=3),
            production_date=original_production,
            expiry_date=today + timedelta(days=2),
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        set_batch_expiry_date(batch, today + timedelta(days=4))
        batch.refresh_from_db()
        self.assertEqual(batch.production_date, original_production)
        self.assertEqual(batch.expiry_date, today + timedelta(days=4))

    def test_mark_expired_inventory_batches(self):
        today = timezone.localdate()
        batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="EXP-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=10),
            expiry_date=today - timedelta(days=1),
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        updated = mark_expired_inventory_batches(dealer_profile_id=self.dealer.id)
        self.assertEqual(updated, 1)
        batch.refresh_from_db()
        self.assertEqual(batch.status, DealerInventoryBatchStatus.EXPIRED)

    def test_available_quantity_excludes_expired_after_mark(self):
        today = timezone.localdate()
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="OK-1",
            quantity=30,
            remaining_quantity=30,
            import_price="10000.00",
            import_date=today,
            expiry_date=today + timedelta(days=5),
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="OLD-1",
            quantity=20,
            remaining_quantity=20,
            import_price="10000.00",
            import_date=today - timedelta(days=10),
            expiry_date=today - timedelta(days=1),
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        mark_expired_inventory_batches(dealer_profile_id=self.dealer.id)

        product = annotate_dealer_product_stock(
            DealerProduct.objects.filter(pk=self.product.pk)
        ).get()
        self.assertEqual(product.available_quantity, 30)
        self.assertEqual(product.total_quantity, 50)

    def test_set_batch_expiry_date(self):
        today = timezone.localdate()
        batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="NULL-EXP-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=3),
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        expiry = today + timedelta(days=4)
        set_batch_expiry_date(batch, expiry)
        batch.refresh_from_db()
        self.assertEqual(batch.expiry_date, expiry)
        self.assertEqual(batch.status, DealerInventoryBatchStatus.ACTIVE)

    def test_set_batch_expiry_date_past_marks_expired(self):
        today = timezone.localdate()
        batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="PAST-EXP-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=10),
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        set_batch_expiry_date(batch, today - timedelta(days=1))
        batch.refresh_from_db()
        self.assertEqual(batch.status, DealerInventoryBatchStatus.EXPIRED)

    def test_recompute_batch_expiry_date(self):
        today = timezone.localdate()
        batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="RECOMP-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=2),
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        recompute_batch_expiry_date(batch)
        batch.refresh_from_db()
        self.assertEqual(batch.expiry_date, today - timedelta(days=2) + timedelta(days=7))

    def test_backfill_batch_expiry_dates(self):
        today = timezone.localdate()
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="BF-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=1),
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        result = backfill_batch_expiry_dates(dealer_profile_id=self.dealer.id)
        self.assertEqual(result["updated"], 1)
        self.assertEqual(result["skipped"], 0)
        batch = DealerInventoryBatch.objects.get(batch_number="BF-1")
        self.assertEqual(batch.expiry_date, today - timedelta(days=1) + timedelta(days=7))

    def test_backfill_with_default_storage_days_and_fix_supplier(self):
        today = timezone.localdate()
        self.supplier_product.storage_duration_days = 2147483647
        self.supplier_product.save(update_fields=["storage_duration_days"])
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="BF-PLACEHOLDER",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=1),
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        result = backfill_batch_expiry_dates(
            dealer_profile_id=self.dealer.id,
            fallback_storage_days=7,
            fix_supplier_products=True,
        )
        self.assertEqual(result["fixed_supplier_products"], 1)
        self.assertEqual(result["updated"], 1)
        self.assertEqual(result["skipped"], 0)
        self.supplier_product.refresh_from_db()
        self.assertEqual(self.supplier_product.storage_duration_days, 7)
        batch = DealerInventoryBatch.objects.get(batch_number="BF-PLACEHOLDER")
        self.assertEqual(batch.expiry_date, today - timedelta(days=1) + timedelta(days=7))


class InventoryExpiryApiTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_exp_api",
            email="dealer_exp_api@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Exp API",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_exp_api",
            email="supplier_exp_api@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Exp API",
            tax_code="0123456789",
            phone="0900000003",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau API",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Cà chua API",
            slug="ca-chua-exp-api",
            unit="kg",
            wholesale_price="10000.00",
            storage_duration_days=5,
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Cà chua API bán lẻ",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        today = timezone.localdate()
        self.batch = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="API-NULL-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today - timedelta(days=2),
            expiry_date=None,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=dealer_account)

    def test_api_set_expiry_date(self):
        expiry = timezone.localdate() + timedelta(days=3)
        response = self.client.post(
            f"/api/dealer-inventory-batches/{self.batch.id}/set-expiry-date/",
            {"expiry_date": expiry.isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["expiry_date"], expiry.isoformat())
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.expiry_date, expiry)

    def test_api_recompute_expiry_date(self):
        response = self.client.post(
            f"/api/dealer-inventory-batches/{self.batch.id}/recompute-expiry-date/",
        )
        self.assertEqual(response.status_code, 200)
        expected = self.batch.import_date + timedelta(days=5)
        self.assertEqual(response.data["expiry_date"], expected.isoformat())

    def test_api_backfill_expiry_dates(self):
        response = self.client.post("/api/dealer-inventory-batches/backfill-expiry-dates/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 1)
        self.batch.refresh_from_db()
        self.assertIsNotNone(self.batch.expiry_date)

    def test_api_backfill_with_default_days(self):
        from apps.supplier_products.models import SupplierProduct

        SupplierProduct.objects.filter(pk=self.product.supplier_product_id).update(
            storage_duration_days=2147483647
        )
        self.batch.expiry_date = None
        self.batch.save(update_fields=["expiry_date"])
        response = self.client.post(
            "/api/dealer-inventory-batches/backfill-expiry-dates/",
            {
                "default_storage_days": 7,
                "fix_supplier_products": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 1)
        self.assertEqual(response.data["fixed_supplier_products"], 1)
        self.batch.refresh_from_db()
        self.assertEqual(
            self.batch.expiry_date,
            self.batch.import_date + timedelta(days=7),
        )

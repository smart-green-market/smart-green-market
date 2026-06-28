"""Tests annotate imported / total / available quantity."""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealer_products.services import annotate_dealer_product_stock, record_wastage
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class AnnotateDealerProductStockTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer1",
            email="dealer1@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier1",
            email="supplier1@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store A",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC A",
            tax_code="0123456789",
            phone="0900000000",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Cà chua",
            slug="ca-chua",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Cà chua bán lẻ",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        today = timezone.localdate()
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="B1",
            quantity=100,
            remaining_quantity=50,
            import_price="10000.00",
            import_date=today,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="B2",
            quantity=80,
            remaining_quantity=20,
            import_price="10000.00",
            import_date=today,
            expiry_date=today - timedelta(days=1),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

    def test_imported_total_available_quantities(self):
        product = annotate_dealer_product_stock(DealerProduct.objects.filter(pk=self.product.pk)).get()
        self.assertEqual(product.imported_quantity, 180)
        self.assertEqual(product.total_quantity, 70)
        self.assertEqual(product.available_quantity, 50)

    def test_wastage_reduces_total_not_imported(self):
        batch = self.product.inventory_batches.get(batch_number="B1")
        record_wastage(
            batch=batch,
            quantity=10,
            reason="Hỏng",
            note="",
            user=self.dealer.account,
        )
        product = annotate_dealer_product_stock(DealerProduct.objects.filter(pk=self.product.pk)).get()
        self.assertEqual(product.imported_quantity, 180)
        self.assertEqual(product.total_quantity, 60)
        self.assertEqual(product.available_quantity, 40)

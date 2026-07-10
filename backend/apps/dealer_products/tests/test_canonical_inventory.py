"""Tests một SP / tên, lô MAIN, nhập kho cộng dồn, gộp trùng."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerProfile
from apps.dealer_products.canonical_inventory import (
    CANONICAL_BATCH_NUMBER,
    add_import_to_main_batch,
    find_canonical_dealer_product,
    get_or_create_canonical_dealer_product,
)
from apps.dealer_products.merge_duplicates import merge_duplicate_dealer_products_for_dealer
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.orders.services import _allocate_batches
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from apps.purchase_orders.services import _import_dealer_inventory
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class CanonicalInventoryTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_canon",
            email="dealer_canon@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_canon",
            email="supplier_canon@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Canon Store",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier_a = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC A",
            tax_code="0123456781",
            phone="0900000001",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        supplier_account_b = Account.objects.create_user(
            username="supplier_canon_b",
            email="supplier_canon_b@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier_b = Supplier.objects.create(
            account=supplier_account_b,
            company_name="NCC B",
            tax_code="0123456782",
            phone="0900000002",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        buyer_account = Account.objects.create_user(
            username="buyer_canon",
            email="buyer_canon@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.customer = CustomerProfile.objects.create(user=buyer_account)
        self.category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.sp_a = SupplierProduct.objects.create(
            supplier=self.supplier_a,
            category=self.category,
            name="Rau lang",
            slug="rau-lang-a",
            unit="kg",
            wholesale_price="8000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.sp_b = SupplierProduct.objects.create(
            supplier=self.supplier_b,
            category=self.category,
            name="Rau lang",
            slug="rau-lang-b",
            unit="kg",
            wholesale_price="7500.00",
            status=SupplierProductStatus.ACTIVE,
        )

    def test_import_reuses_canonical_product_across_suppliers(self):
        for sp, qty in ((self.sp_a, 40), (self.sp_b, 70)):
            order = PurchaseOrder.objects.create(
                order_code=f"PN-CANON-{sp.id}",
                supplier=sp.supplier,
                dealer=self.dealer,
                status=PurchaseOrderStatus.COMPLETED,
                delivery_address="Addr",
                requested_delivery_time=timezone.now(),
                receiver_name="Dealer",
                receiver_phone="0900000000",
                total_amount=Decimal("500000"),
            )
            PurchaseOrderItem.objects.create(
                purchase_order=order,
                supplier_product=sp,
                quantity=qty,
                original_quantity=qty,
                unit_price=sp.wholesale_price,
                base_unit_price=sp.wholesale_price,
                subtotal=Decimal(qty) * Decimal(str(sp.wholesale_price)),
                review_status="approved",
            )
            _import_dealer_inventory(order, self.dealer.account)

        products = DealerProduct.objects.filter(
            dealer_profile=self.dealer,
        ).exclude(status=DealerProductStatus.DELETED)
        self.assertEqual(products.count(), 1)
        product = products.get()
        self.assertEqual(product.title, "Rau lang")

        batches = DealerInventoryBatch.objects.filter(
            dealer_product=product,
            deleted_at__isnull=True,
        )
        self.assertEqual(batches.count(), 1)
        main = batches.get()
        self.assertEqual(main.batch_number, CANONICAL_BATCH_NUMBER)
        self.assertEqual(main.remaining_quantity, 110)

    def test_merge_duplicate_products_consolidates_stock(self):
        p1 = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.sp_a,
            title="Rau lang — bán lẻ",
            retail_price="12000.00",
            status=DealerProductStatus.ACTIVE,
        )
        p2 = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.sp_b,
            title="Rau lang",
            retail_price="8000.00",
            status=DealerProductStatus.ACTIVE,
        )
        DealerInventoryBatch.objects.create(
            dealer_product=p1,
            batch_number="OLD-1",
            quantity=30,
            remaining_quantity=30,
            import_price="8000.00",
            import_date=timezone.localdate(),
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        DealerInventoryBatch.objects.create(
            dealer_product=p2,
            batch_number=CANONICAL_BATCH_NUMBER,
            quantity=50,
            remaining_quantity=50,
            import_price="7500.00",
            import_date=timezone.localdate(),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

        result = merge_duplicate_dealer_products_for_dealer(self.dealer)
        self.assertEqual(result["merged_groups"], 1)
        self.assertEqual(result["merged_products"], 1)

        active = DealerProduct.objects.filter(
            dealer_profile=self.dealer,
            status=DealerProductStatus.ACTIVE,
        )
        self.assertEqual(active.count(), 1)
        canonical = active.get()
        main = DealerInventoryBatch.objects.get(
            dealer_product=canonical,
            batch_number=CANONICAL_BATCH_NUMBER,
            deleted_at__isnull=True,
        )
        self.assertEqual(main.remaining_quantity, 80)

    def test_allocate_from_single_main_batch(self):
        product, _ = get_or_create_canonical_dealer_product(
            self.dealer,
            supplier_product=self.sp_a,
            retail_price=Decimal("12000"),
            category=self.category,
        )
        add_import_to_main_batch(
            dealer_product=product,
            quantity=25,
            import_price=Decimal("8000"),
            reason="test",
            user=self.dealer.account,
        )
        allocations = _allocate_batches(product, 10)
        self.assertEqual(len(allocations), 1)
        batch, qty = allocations[0]
        self.assertEqual(batch.batch_number, CANONICAL_BATCH_NUMBER)
        self.assertEqual(qty, 10)

    def test_waiting_stock_allocates_after_import_to_canonical(self):
        product_old = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=self.sp_a,
            title="Táo",
            retail_price="19000.00",
            status=DealerProductStatus.ACTIVE,
        )
        order = Order.objects.create(
            order_code="DH-WAIT-001",
            dealer=self.dealer,
            customer=self.customer,
            status=OrderStatus.WAITING_STOCK,
            delivery_time=timezone.now() + timezone.timedelta(days=1),
            delivery_address="Addr",
            receiver_name="Buyer",
            receiver_phone="0900000003",
            subtotal_amount=Decimal("57000"),
            total_amount=Decimal("57000"),
            debt_amount=Decimal("57000"),
        )
        OrderItem.objects.create(
            order=order,
            dealer_product=product_old,
            batch=None,
            product_title="Táo",
            unit="kg",
            quantity=3,
            unit_price=Decimal("19000"),
            subtotal=Decimal("57000"),
        )

        sp_tao = SupplierProduct.objects.create(
            supplier=self.supplier_b,
            category=self.category,
            name="Táo",
            slug="tao-b",
            unit="kg",
            wholesale_price="16000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        po = PurchaseOrder.objects.create(
            order_code="PN-TAO-001",
            supplier=self.supplier_b,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=timezone.now(),
            receiver_name="Dealer",
            receiver_phone="0900000000",
            total_amount=Decimal("1100000"),
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            supplier_product=sp_tao,
            quantity=110,
            original_quantity=110,
            unit_price=Decimal("16000"),
            base_unit_price=Decimal("16000"),
            subtotal=Decimal("1760000"),
            review_status="approved",
        )
        _import_dealer_inventory(po, self.dealer.account)

        canonical = find_canonical_dealer_product(self.dealer, "Táo")
        self.assertIsNotNone(canonical)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.PROCESSING)
        order.items.first().refresh_from_db()
        self.assertIsNotNone(order.items.first().batch)

"""Tests giảm giá theo tuổi lô hàng."""

from datetime import datetime, time, timedelta, timezone as dt_timezone
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.age_discount import (
    compute_batch_effective_price,
    compute_product_display_price,
    price_for_order_allocation,
)
from apps.dealer_products.canonical_inventory import CANONICAL_BATCH_NUMBER
from apps.dealer_products.inventory_queries import get_sellable_batches_qs
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealer_products.models_age_discount import (
    AgeDiscountDiscountType,
    AgeDiscountPolicy,
    AgeDiscountScope,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.orders.services import _allocate_batches
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class AgeDiscountServiceTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_age",
            email="dealer_age@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_age",
            email="supplier_age@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Age",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Age",
            tax_code="0123456781",
            phone="0900000002",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=self.category,
            name="Cà chua",
            slug="ca-chua-age",
            unit="kg",
            wholesale_price="10000.00",
            storage_duration_days=10,
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            category=self.category,
            title="Cà chua",
            retail_price=Decimal("25000.00"),
            status=DealerProductStatus.ACTIVE,
        )
        today = timezone.localdate()
        self.batch_old = DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number=CANONICAL_BATCH_NUMBER,
            quantity=25,
            remaining_quantity=25,
            import_price="10000.00",
            import_date=today - timedelta(days=8),
            expiry_date=today + timedelta(days=2),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

    def test_manual_sale_price_priority(self):
        self.batch_old.manual_sale_price = Decimal("18000.00")
        self.batch_old.save(update_fields=["manual_sale_price"])
        result = compute_batch_effective_price(self.batch_old)
        self.assertEqual(result.effective_unit_price, Decimal("18000.00"))
        self.assertEqual(result.age_discount_source, "manual")

    def test_active_policy_discount_applies_by_time_window(self):
        AgeDiscountPolicy.objects.create(
            dealer=self.dealer,
            title="Khung giờ giảm giá",
            scope=AgeDiscountScope.ALL,
            discount_type=AgeDiscountDiscountType.PERCENT,
            discount_value=Decimal("20"),
            start_at=timezone.now() - timedelta(hours=1),
            end_at=timezone.now() + timedelta(hours=1),
            is_active=True,
        )
        result = compute_batch_effective_price(self.batch_old)
        self.assertEqual(result.age_discount_source, "policy")
        self.assertEqual(result.effective_unit_price, Decimal("20000.00"))

    def test_policy_outside_time_window_does_not_apply(self):
        AgeDiscountPolicy.objects.create(
            dealer=self.dealer,
            title="Khung giờ đã kết thúc",
            scope=AgeDiscountScope.ALL,
            discount_type=AgeDiscountDiscountType.PERCENT,
            discount_value=Decimal("20"),
            start_at=timezone.now() - timedelta(hours=2),
            end_at=timezone.now() - timedelta(hours=1),
            is_active=True,
        )
        result = compute_batch_effective_price(self.batch_old)
        self.assertEqual(result.age_discount_source, "none")
        self.assertEqual(result.effective_unit_price, self.product.retail_price)

    def test_display_price_uses_fifo_batch(self):
        AgeDiscountPolicy.objects.create(
            dealer=self.dealer,
            title="Giảm theo khung giờ",
            scope=AgeDiscountScope.ALL,
            discount_type=AgeDiscountDiscountType.PERCENT,
            discount_value=Decimal("20"),
            is_active=True,
        )
        display = compute_product_display_price(self.product)
        old_price = compute_batch_effective_price(self.batch_old)
        self.assertEqual(display.effective_unit_price, old_price.effective_unit_price)
        self.assertEqual(display.effective_unit_price, Decimal("20000.00"))

    def test_main_batch_allocation_uses_single_batch(self):
        allocations = _allocate_batches(self.product, 7)
        self.assertEqual(len(allocations), 1)
        batch, qty = allocations[0]
        self.assertEqual(batch.id, self.batch_old.id)
        self.assertEqual(qty, 7)

    def test_expired_main_batch_still_sellable(self):
        today = timezone.localdate()
        self.batch_old.expiry_date = today - timedelta(days=1)
        self.batch_old.save(update_fields=["expiry_date", "updated_at"])
        self.assertTrue(
            get_sellable_batches_qs(self.product).filter(pk=self.batch_old.pk).exists()
        )

    def test_daily_time_window_uses_vietnam_timezone(self):
        policy = AgeDiscountPolicy.objects.create(
            dealer=self.dealer,
            title="Flash sale VN",
            scope=AgeDiscountScope.ALL,
            discount_type=AgeDiscountDiscountType.PERCENT,
            discount_value=Decimal("20"),
            daily_start_time=time(17, 0),
            daily_end_time=time(19, 0),
            is_active=True,
        )
        at_vn_evening = datetime(2026, 7, 2, 11, 0, tzinfo=dt_timezone.utc)
        at_vn_morning = datetime(2026, 7, 2, 3, 0, tzinfo=dt_timezone.utc)

        self.assertTrue(policy.is_within_daily_time(at_vn_evening))
        self.assertFalse(policy.is_within_daily_time(at_vn_morning))

        result = compute_batch_effective_price(self.batch_old, at=at_vn_evening)
        self.assertEqual(result.age_discount_source, "policy")
        self.assertEqual(result.effective_unit_price, Decimal("20000.00"))

        outside = compute_batch_effective_price(self.batch_old, at=at_vn_morning)
        self.assertEqual(outside.age_discount_source, "none")
        self.assertEqual(outside.effective_unit_price, self.product.retail_price)

    def test_product_specific_policy_beats_all_scope_policy(self):
        AgeDiscountPolicy.objects.create(
            dealer=self.dealer,
            title="Giảm tất cả",
            scope=AgeDiscountScope.ALL,
            discount_type=AgeDiscountDiscountType.PERCENT,
            discount_value=Decimal("10"),
            is_active=True,
        )
        AgeDiscountPolicy.objects.create(
            dealer=self.dealer,
            title="Giảm sản phẩm cụ thể",
            scope=AgeDiscountScope.DEALER_PRODUCT,
            dealer_product=self.product,
            discount_type=AgeDiscountDiscountType.PERCENT,
            discount_value=Decimal("30"),
            is_active=True,
        )

        result = compute_batch_effective_price(self.batch_old)
        self.assertEqual(result.effective_unit_price, Decimal("17500.00"))

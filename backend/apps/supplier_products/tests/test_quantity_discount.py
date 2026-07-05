"""Tests giảm giá theo số lượng đặt hàng B2B."""

from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.supplier_products.models_quantity_discount import (
    QuantityDiscountPolicy,
    QuantityDiscountScope,
    QuantityDiscountTier,
    QuantityDiscountType,
)
from apps.supplier_products.quantity_discount import (
    compute_wholesale_unit_price,
    get_quantity_discount_tiers_for_product,
)
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class QuantityDiscountServiceTests(TestCase):
    def setUp(self):
        supplier_account = Account.objects.create_user(
            username="supplier_qty",
            email="supplier_qty@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Qty",
            tax_code="0123456789",
            phone="0900000001",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Cà chua sỉ",
            slug="ca-chua-si",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.policy = QuantityDiscountPolicy.objects.create(
            supplier=self.supplier,
            title="Giảm theo SL",
            scope=QuantityDiscountScope.ALL,
            is_active=True,
        )
        QuantityDiscountTier.objects.create(
            policy=self.policy,
            min_quantity=Decimal("50"),
            discount_type=QuantityDiscountType.PERCENT,
            discount_value=Decimal("5"),
            sort_order=0,
        )
        QuantityDiscountTier.objects.create(
            policy=self.policy,
            min_quantity=Decimal("100"),
            discount_type=QuantityDiscountType.PERCENT,
            discount_value=Decimal("10"),
            sort_order=1,
        )

    def test_no_discount_below_threshold(self):
        result = compute_wholesale_unit_price(self.product, Decimal("30"))
        self.assertEqual(result.effective_unit_price, Decimal("10000.00"))
        self.assertIsNone(result.tier_id)

    def test_tier_50_percent_5(self):
        result = compute_wholesale_unit_price(self.product, Decimal("50"))
        self.assertEqual(result.effective_unit_price, Decimal("9500.00"))
        self.assertEqual(result.discount_value, Decimal("5"))

    def test_tier_100_percent_10(self):
        result = compute_wholesale_unit_price(self.product, Decimal("100"))
        self.assertEqual(result.effective_unit_price, Decimal("9000.00"))
        self.assertEqual(result.discount_value, Decimal("10"))

    def test_tiers_exposed_for_product(self):
        tiers = get_quantity_discount_tiers_for_product(self.product)
        self.assertEqual(len(tiers), 2)
        self.assertEqual(tiers[0]["min_quantity"], Decimal("50"))
        self.assertEqual(tiers[1]["min_quantity"], Decimal("100"))

    def test_product_scope_policy(self):
        other_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Dưa leo",
            slug="dua-leo",
            unit="kg",
            wholesale_price=Decimal("8000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        policy = QuantityDiscountPolicy.objects.create(
            supplier=self.supplier,
            title="Dưa leo riêng",
            scope=QuantityDiscountScope.SUPPLIER_PRODUCT,
            supplier_product=other_product,
            priority=10,
            is_active=True,
        )
        QuantityDiscountTier.objects.create(
            policy=policy,
            min_quantity=Decimal("20"),
            discount_type=QuantityDiscountType.PERCENT,
            discount_value=Decimal("15"),
            sort_order=0,
        )

        result = compute_wholesale_unit_price(other_product, Decimal("20"))
        self.assertEqual(result.effective_unit_price, Decimal("6800.00"))

        tomato_result = compute_wholesale_unit_price(self.product, Decimal("100"))
        self.assertEqual(tomato_result.effective_unit_price, Decimal("9000.00"))

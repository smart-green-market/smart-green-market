"""Tests get_dealer_customer_snapshot — metrics RFM theo đại lý."""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerProfile
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.marketing.customer_metrics import get_dealer_customer_snapshot
from apps.marketing.models import CustomerInteraction
from apps.orders.models import Order, OrderStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class CustomerMetricsSnapshotTests(TestCase):
    def setUp(self):
        self.now = timezone.now()
        self.today = timezone.localdate()

        dealer_account = Account.objects.create_user(
            username="dealer_metrics",
            email="dealer_metrics@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Metrics",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )

        supplier_account = Account.objects.create_user(
            username="sup_metrics",
            email="sup_metrics@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Metrics",
            tax_code="3333333333",
            phone="0900000003",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau Metrics",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Cà chua Metrics",
            slug="ca-chua-metrics",
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

        self.customer_a = self._create_customer("buyer_a_metrics@test.com", "Buyer A")
        self.customer_b = self._create_customer("buyer_b_metrics@test.com", "Buyer B")

    def _create_customer(self, email: str, full_name: str) -> CustomerProfile:
        account = Account.objects.create_user(
            username=email.replace("@", "_at_"),
            email=email,
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer,
            full_name=full_name,
        )
        return CustomerProfile.objects.create(user=account)

    def _create_order(
        self,
        *,
        customer: CustomerProfile,
        code: str,
        status: str,
        total_amount: str,
        completed_at=None,
    ) -> Order:
        completed = completed_at
        return Order.objects.create(
            order_code=code,
            customer=customer,
            dealer=self.dealer,
            status=status,
            receiver_name="Test",
            receiver_phone="0900000000",
            delivery_address="Addr",
            delivery_time=self.now,
            total_amount=Decimal(total_amount),
            paid_amount=Decimal(total_amount) if status == OrderStatus.COMPLETED else Decimal("0"),
            completed_at=completed,
        )

    def _create_interaction(
        self,
        *,
        customer: CustomerProfile,
        view_count: int,
        days_ago: int,
    ) -> CustomerInteraction:
        return CustomerInteraction.objects.create(
            customer=customer,
            dealer=self.dealer,
            dealer_product=self.product,
            view_count=view_count,
            last_viewed_at=self.now - timedelta(days=days_ago),
        )

    def test_raises_when_days_invalid(self):
        with self.assertRaises(ValueError):
            get_dealer_customer_snapshot(dealer_id=self.dealer.id, days=0)

    def test_returns_empty_when_no_completed_orders_in_window(self):
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-PENDING",
            status=OrderStatus.PENDING,
            total_amount="100000",
        )
        self.assertEqual(
            get_dealer_customer_snapshot(dealer_id=self.dealer.id, days=30),
            [],
        )

    def test_snapshot_aggregates_completed_orders_and_conversion(self):
        # Customer A: 2 completed trong kỳ, 1 pending (bỏ qua), 1 completed quá cũ (bỏ qua)
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-A1",
            status=OrderStatus.COMPLETED,
            total_amount="300000",
            completed_at=self.now - timedelta(days=5),
        )
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-A2",
            status=OrderStatus.COMPLETED,
            total_amount="200000",
            completed_at=self.now - timedelta(days=10),
        )
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-A-PENDING",
            status=OrderStatus.PENDING,
            total_amount="999999",
        )
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-A-OLD",
            status=OrderStatus.COMPLETED,
            total_amount="888888",
            completed_at=self.now - timedelta(days=40),
        )
        self._create_interaction(customer=self.customer_a, view_count=10, days_ago=3)

        # Customer B: 1 completed, không có interaction -> conversion 0
        self._create_order(
            customer=self.customer_b,
            code="ORD-M-B1",
            status=OrderStatus.COMPLETED,
            total_amount="150000",
            completed_at=self.now - timedelta(days=2),
        )

        result = get_dealer_customer_snapshot(dealer_id=self.dealer.id, days=30)
        by_id = {row["customer_id"]: row for row in result}

        self.assertEqual(len(result), 2)

        row_a = by_id[self.customer_a.id]
        self.assertEqual(row_a["Total_order"], 2)
        self.assertEqual(row_a["Total_spent"], 500000.0)
        self.assertEqual(row_a["Last_order"], (self.today - (self.now - timedelta(days=5)).date()).days)
        self.assertEqual(row_a["Conversion_rate"], 20.0)  # 2 / 10 * 100

        row_b = by_id[self.customer_b.id]
        self.assertEqual(row_b["Total_order"], 1)
        self.assertEqual(row_b["Total_spent"], 150000.0)
        self.assertEqual(row_b["Last_order"], (self.today - (self.now - timedelta(days=2)).date()).days)
        self.assertEqual(row_b["Conversion_rate"], 0.0)

    def test_sums_view_count_across_products_in_period(self):
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-A3",
            status=OrderStatus.COMPLETED,
            total_amount="100000",
            completed_at=self.now - timedelta(days=1),
        )
        CustomerInteraction.objects.create(
            customer=self.customer_a,
            dealer=self.dealer,
            dealer_product=self.product,
            view_count=4,
            last_viewed_at=self.now - timedelta(days=1),
        )
        # SP thứ 2 cùng dealer
        supplier_product_2 = SupplierProduct.objects.create(
            supplier=self.product.supplier_product.supplier,
            category=self.product.supplier_product.category,
            name="Dưa leo Metrics",
            slug="dua-leo-metrics",
            unit="kg",
            wholesale_price="8000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        product_2 = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product_2,
            title="Dưa leo bán lẻ",
            retail_price="12000.00",
            status=DealerProductStatus.ACTIVE,
        )
        CustomerInteraction.objects.create(
            customer=self.customer_a,
            dealer=self.dealer,
            dealer_product=product_2,
            view_count=6,
            last_viewed_at=self.now - timedelta(days=2),
        )
        # SP thứ 3 — view ngoài kỳ, không được cộng vào Total_click
        supplier_product_3 = SupplierProduct.objects.create(
            supplier=self.product.supplier_product.supplier,
            category=self.product.supplier_product.category,
            name="Xà lách Metrics",
            slug="xa-lach-metrics",
            unit="kg",
            wholesale_price="7000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        product_3 = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product_3,
            title="Xà lách bán lẻ",
            retail_price="11000.00",
            status=DealerProductStatus.ACTIVE,
        )
        CustomerInteraction.objects.create(
            customer=self.customer_a,
            dealer=self.dealer,
            dealer_product=product_3,
            view_count=100,
            last_viewed_at=self.now - timedelta(days=60),
        )

        row = get_dealer_customer_snapshot(dealer_id=self.dealer.id, days=30)[0]
        self.assertEqual(row["Total_order"], 1)
        self.assertEqual(row["Conversion_rate"], 10.0)  # 1 / (4+6) * 100

    def test_excludes_cancelled_orders(self):
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-CANCEL",
            status=OrderStatus.CANCELLED,
            total_amount="500000",
            completed_at=self.now - timedelta(days=1),
        )
        self.assertEqual(
            get_dealer_customer_snapshot(dealer_id=self.dealer.id, days=30),
            [],
        )

    def test_debug_mode_includes_debug_payload(self):
        self._create_order(
            customer=self.customer_a,
            code="ORD-M-DEBUG",
            status=OrderStatus.COMPLETED,
            total_amount="100000",
            completed_at=self.now - timedelta(days=1),
        )
        self._create_interaction(customer=self.customer_a, view_count=2, days_ago=1)

        row = get_dealer_customer_snapshot(dealer_id=self.dealer.id, days=30, debug=True)[0]

        self.assertIn("_debug", row)
        self.assertEqual(row["_debug"]["total_click"], 2)
        self.assertEqual(row["_debug"]["formula"], "1 / 2 * 100 = 50.0")
        self.assertEqual(len(row["_debug"]["order_ids"]), 1)
        self.assertEqual(len(row["_debug"]["interaction_rows"]), 1)
        self.assertEqual(row["_debug"]["interaction_rows"][0]["view_count"], 2)

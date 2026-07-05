from datetime import datetime, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerAddress, CustomerProfile
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.orders.services import create_customer_order
from apps.orders.delivery_slots import get_available_delivery_slots
from apps.promotions.models import (
    CustomerSavedVoucher,
    Promotion,
    PromotionDiscountType,
    PromotionStatus,
    PromotionUsage,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus

from .services import CartVoucherService


class SavedVoucherFlowTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_voucher",
            email="dealer_voucher@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_voucher",
            email="supplier_voucher@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        buyer_account = Account.objects.create_user(
            username="buyer_voucher",
            email="buyer_voucher@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Voucher Store",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        buyer_account.store_dealer = self.dealer
        buyer_account.save(update_fields=["store_dealer"])
        self.customer = CustomerProfile.objects.create(user=buyer_account)
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            receiver_name="Buyer",
            receiver_phone="0900000000",
            address="HN",
            is_default=True,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Voucher",
            tax_code="0123456782",
            phone="0900000003",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Trai cay",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=self.category,
            name="Tao",
            slug="tao-voucher",
            unit="kg",
            wholesale_price="10000.00",
            storage_duration_days=10,
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            category=self.category,
            title="Tao ban le",
            retail_price=Decimal("25000.00"),
            status=DealerProductStatus.ACTIVE,
        )
        today = timezone.localdate()
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number="VOUCHER-1",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=today,
            expiry_date=today + timedelta(days=10),
            status=DealerInventoryBatchStatus.ACTIVE,
        )
        self.promotion = Promotion.objects.create(
            dealer=self.dealer,
            created_by=dealer_account,
            title="Save 10",
            code="SAVE10",
            discount_type=PromotionDiscountType.PERCENT,
            discount_value=Decimal("10"),
            min_order_amount=Decimal("0"),
            start_date=timezone.now() - timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=1),
            status=PromotionStatus.ACTIVE,
        )

    def test_apply_requires_saved_voucher(self):
        with self.assertRaisesMessage(ValidationError, "Bạn cần lưu voucher trước khi áp dụng."):
            CartVoucherService.apply_voucher(
                self.customer,
                "SAVE10",
                [{"dealer_product_id": self.product.id, "quantity": 2}],
            )

    def test_saved_voucher_can_be_applied(self):
        CustomerSavedVoucher.objects.create(
            customer=self.customer,
            promotion=self.promotion,
        )

        result = CartVoucherService.apply_voucher(
            self.customer,
            "SAVE10",
            [{"dealer_product_id": self.product.id, "quantity": 2}],
        )

        self.assertEqual(result["discount_amount"], 5000)
        self.assertEqual(result["final_total"], 45000)

    def test_order_creation_applies_saved_voucher_and_records_usage(self):
        CustomerSavedVoucher.objects.create(
            customer=self.customer,
            promotion=self.promotion,
        )
        delivery_time = next(
            datetime.fromisoformat(slot["delivery_time"])
            for day in get_available_delivery_slots()["dates"]
            for slot in day["slots"]
            if slot["available"]
        )

        order = create_customer_order(
            dealer=self.dealer,
            customer=self.customer,
            customer_address_id=self.address.id,
            delivery_time=delivery_time,
            note="",
            items_data=[{"dealer_product": self.product, "quantity": 2}],
            user=self.customer.user,
            voucher_code="SAVE10",
        )

        self.assertEqual(order.subtotal_amount, Decimal("50000.00"))
        self.assertEqual(order.discount_amount, Decimal("5000.00"))
        self.assertEqual(
            PromotionUsage.objects.get(order=order, promotion=self.promotion).discount_amount,
            Decimal("5000.00"),
        )

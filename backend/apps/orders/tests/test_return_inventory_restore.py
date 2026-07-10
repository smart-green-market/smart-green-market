"""Tests hoàn tồn kho khi dealer duyệt trả hàng buyer."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerAddress, CustomerProfile
from apps.dealer_products.canonical_inventory import CANONICAL_BATCH_NUMBER
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.orders.models import (
    CustomerPayment,
    CustomerPaymentMethod,
    CustomerPaymentStatus,
    CustomerPaymentType,
    Order,
    OrderItem,
    OrderReturnStatus,
    OrderStatus,
)
from apps.orders.services import (
    buyer_request_return,
    dealer_review_return,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class ReturnInventoryRestoreTests(TestCase):
    def setUp(self):
        self.now = timezone.now()

        dealer_account = Account.objects.create_user(
            username="dealer_return_inv",
            email="dealer_return_inv@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Return Inv",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        buyer_account = Account.objects.create_user(
            username="buyer_return_inv",
            email="buyer_return_inv@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.customer = CustomerProfile.objects.create(
            user=buyer_account,
            total_spent=Decimal("50000.00"),
        )
        self.buyer_user = buyer_account
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            receiver_name="Buyer Return",
            receiver_phone="0900111222",
            address="123 Test St",
            is_default=True,
        )

        supplier_account = Account.objects.create_user(
            username="sup_return_inv",
            email="sup_return_inv@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Return Inv",
            tax_code="5555555555",
            phone="0900000005",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau Return Inv",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Cà chua Return",
            slug="ca-chua-return-inv",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.dealer_product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Cà chua bán lẻ",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        self.batch = DealerInventoryBatch.objects.create(
            dealer_product=self.dealer_product,
            batch_number=CANONICAL_BATCH_NUMBER,
            quantity=20,
            remaining_quantity=5,
            import_price="10000.00",
            import_date=self.now.date(),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

        self.order = Order.objects.create(
            order_code="DH-TEST-RETURN-INV",
            customer=self.customer,
            dealer=self.dealer,
            customer_address=self.address,
            status=OrderStatus.COMPLETED,
            receiver_name=self.address.receiver_name,
            receiver_phone=self.address.receiver_phone,
            delivery_address=self.address.address,
            delivery_time=self.now,
            subtotal_amount=Decimal("45000.00"),
            total_amount=Decimal("45000.00"),
            paid_amount=Decimal("45000.00"),
            debt_amount=Decimal("0"),
            completed_at=self.now,
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            dealer_product=self.dealer_product,
            batch=self.batch,
            product_title=self.dealer_product.title,
            unit="kg",
            quantity=3,
            unit_price=Decimal("15000.00"),
            import_price=Decimal("10000.00"),
            subtotal=Decimal("45000.00"),
        )
        CustomerPayment.objects.create(
            order=self.order,
            payment_method=CustomerPaymentMethod.CASH,
            payment_type=CustomerPaymentType.COD,
            amount=Decimal("45000.00"),
            status=CustomerPaymentStatus.PAID,
            paid_at=self.now,
        )

    def test_approved_return_restores_inventory(self):
        order_return = buyer_request_return(
            self.order,
            self.buyer_user,
            reason="Hàng hỏng",
        )
        dealer_review_return(order_return, self.dealer_user, approved=True)

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_quantity, 8)
        self.assertEqual(self.batch.status, DealerInventoryBatchStatus.ACTIVE)
        self.assertEqual(self.order.status, OrderStatus.RETURNED)
        self.assertEqual(order_return.status, OrderReturnStatus.APPROVED)

        tx = DealerInventoryTransaction.objects.filter(
            batch=self.batch,
            type=DealerInventoryTransactionType.RETURN_RESTORE,
        ).get()
        self.assertEqual(tx.quantity_change, 3)
        self.assertEqual(tx.quantity_before, 5)
        self.assertEqual(tx.quantity_after, 8)

    def test_rejected_return_does_not_restore_inventory(self):
        order_return = buyer_request_return(
            self.order,
            self.buyer_user,
            reason="Không vừa ý",
        )
        dealer_review_return(
            order_return,
            self.dealer_user,
            approved=False,
            review_note="Không đủ điều kiện trả",
        )

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_quantity, 5)
        self.assertFalse(
            DealerInventoryTransaction.objects.filter(
                batch=self.batch,
                type=DealerInventoryTransactionType.RETURN_RESTORE,
            ).exists()
        )

    def test_approved_return_reactivates_depleted_batch(self):
        self.batch.remaining_quantity = 0
        self.batch.status = DealerInventoryBatchStatus.DEPLETED
        self.batch.save(update_fields=["remaining_quantity", "status", "updated_at"])

        order_return = buyer_request_return(
            self.order,
            self.buyer_user,
            reason="Trả hàng",
        )
        dealer_review_return(order_return, self.dealer_user, approved=True)

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_quantity, 3)
        self.assertEqual(self.batch.status, DealerInventoryBatchStatus.ACTIVE)

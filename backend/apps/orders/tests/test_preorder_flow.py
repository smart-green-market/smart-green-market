"""Tests luồng YC đặt trước B2C và phân bổ waiting_stock."""

from datetime import date, datetime
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

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
from apps.notifications.models import NotificationReceipt
from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatus,
    PreOrderRequest,
    PreOrderRequestStatus,
)
from apps.orders import preorder_services
from apps.orders import delivery_reschedule_services
from apps.orders.delivery_slots import VN_TZ, resolve_delivery_time
from apps.orders.services import create_customer_order
from apps.orders.waiting_stock_services import try_allocate_waiting_orders
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class PreOrderFlowTestBase(TestCase):
    FIXED_NOW = datetime(2026, 6, 21, 8, 0, tzinfo=VN_TZ)

    def setUp(self):
        self.now_patcher = patch.object(timezone, "now", return_value=self.FIXED_NOW)
        self.now_patcher.start()
        self.addCleanup(self.now_patcher.stop)

        self.push_patcher = patch("common.notifications.push_notification_to_account")
        self.mock_push = self.push_patcher.start()
        self.addCleanup(self.push_patcher.stop)

        self.delivery_time = resolve_delivery_time(date(2026, 6, 22), "morning")

        dealer_account = Account.objects.create_user(
            username=f"dealer_po_{self._testMethodName}",
            email=f"dealer_po_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store PO",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        buyer_account = Account.objects.create_user(
            username=f"buyer_po_{self._testMethodName}",
            email=f"buyer_po_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.customer = CustomerProfile.objects.create(user=buyer_account)
        self.buyer_user = buyer_account
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            receiver_name="Buyer PO",
            receiver_phone="0900111222",
            address="123 Test St",
            is_default=True,
        )

        supplier_account = Account.objects.create_user(
            username=f"sup_po_{self._testMethodName}",
            email=f"sup_po_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC PO",
            tax_code=f"TAX-PO-{self._testMethodName}"[:50],
            phone="0900000000",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name=f"Rau PO {self._testMethodName}",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Rau PO",
            slug=f"rau-po-{self._testMethodName}",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.dealer_product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Rau bán lẻ PO",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        self.batch = DealerInventoryBatch.objects.create(
            dealer_product=self.dealer_product,
            batch_number=f"B-PO-{self._testMethodName}",
            quantity=10,
            remaining_quantity=10,
            import_price="10000.00",
            import_date=self.FIXED_NOW.date(),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

    def _create_preorder(self, quantity=20):
        return preorder_services.create_preorder_request(
            dealer=self.dealer,
            customer=self.customer,
            customer_address_id=self.address.id,
            delivery_time=self.delivery_time,
            note="YC test",
            items_data=[{"dealer_product": self.dealer_product, "quantity": quantity}],
            user=self.buyer_user,
        )

    def _create_waiting_order(self, *, quantity=20, delivery_time=None):
        preorder = self._create_preorder(quantity=quantity)
        preorder_services.dealer_confirm_preorder(preorder, self.dealer_user)
        if delivery_time is not None:
            preorder.requested_delivery_time = delivery_time
            preorder.save(update_fields=["requested_delivery_time"])
        return preorder_services.customer_accept_preorder(preorder, self.buyer_user)


class CheckStockTests(PreOrderFlowTestBase):
    def test_check_stock_shows_shortfall(self):
        results = preorder_services.check_items_stock(
            self.dealer,
            [{"dealer_product_id": self.dealer_product.id, "quantity": 20}],
        )
        self.assertEqual(len(results), 1)
        row = results[0]
        self.assertEqual(row["available_quantity"], 10)
        self.assertEqual(row["shortfall"], 10)
        self.assertTrue(row["needs_preorder"])
        self.assertEqual(row["order_available_quantity"], 10)

    def test_create_order_fails_when_insufficient_stock(self):
        with self.assertRaises(Exception):
            create_customer_order(
                dealer=self.dealer,
                customer=self.customer,
                customer_address_id=self.address.id,
                delivery_time=self.delivery_time,
                note="",
                items_data=[{"dealer_product": self.dealer_product, "quantity": 20}],
                user=self.buyer_user,
            )

    def test_create_order_succeeds_with_available_quantity(self):
        order = create_customer_order(
            dealer=self.dealer,
            customer=self.customer,
            customer_address_id=self.address.id,
            delivery_time=self.delivery_time,
            note="",
            items_data=[{"dealer_product": self.dealer_product, "quantity": 5}],
            user=self.buyer_user,
        )
        self.assertEqual(order.status, OrderStatus.PENDING)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_quantity, 5)


class PreOrderWorkflowTests(PreOrderFlowTestBase):
    def test_full_preorder_to_waiting_stock(self):
        preorder = self._create_preorder(quantity=20)
        self.assertEqual(preorder.status, PreOrderRequestStatus.SUBMITTED)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_quantity, 10)

        preorder_services.dealer_confirm_preorder(preorder, self.dealer_user)
        preorder.refresh_from_db()
        self.assertEqual(preorder.status, PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING)

        order = preorder_services.customer_accept_preorder(preorder, self.buyer_user)
        preorder.refresh_from_db()
        self.assertEqual(preorder.status, PreOrderRequestStatus.CONVERTED)
        self.assertEqual(order.status, OrderStatus.WAITING_STOCK)
        self.assertIsNone(order.items.first().batch)

        self.batch.remaining_quantity = 20
        self.batch.save(update_fields=["remaining_quantity"])
        allocated = try_allocate_waiting_orders(
            dealer_product_id=self.dealer_product.id,
            user=self.dealer_user,
        )
        self.assertEqual(len(allocated), 1)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.PROCESSING)
        self.assertIsNotNone(order.items.first().batch)

    def test_dealer_propose_customer_reject_closes_request(self):
        preorder = self._create_preorder(quantity=20)
        new_delivery = resolve_delivery_time(date(2026, 6, 22), "afternoon")
        preorder_services.dealer_propose_preorder(
            preorder,
            self.dealer_user,
            proposed_delivery_time=new_delivery,
            item_quantities={str(preorder.items.first().id): 15},
        )
        preorder = preorder_services.customer_reject_preorder(
            preorder,
            self.buyer_user,
            reason="Không đồng ý",
        )
        self.assertEqual(preorder.status, PreOrderRequestStatus.REJECTED_BY_CUSTOMER)
        self.assertEqual(Order.objects.filter(status=OrderStatus.WAITING_STOCK).count(), 0)

    def test_preorder_notifies_dealer_on_submit(self):
        preorder = self._create_preorder(quantity=20)
        self.assertTrue(
            NotificationReceipt.objects.filter(
                account=self.dealer_user,
                notification__reference_type="customer_preorder_request",
                notification__reference_id=preorder.id,
            ).exists()
        )


class WaitingStockAllocationTests(PreOrderFlowTestBase):
    def test_allocate_prioritizes_earlier_delivery_time(self):
        self.batch.remaining_quantity = 5
        self.batch.save(update_fields=["remaining_quantity"])

        later_delivery = resolve_delivery_time(date(2026, 6, 22), "afternoon")
        order_early = self._create_waiting_order(
            quantity=10,
            delivery_time=self.delivery_time,
        )
        order_late = self._create_waiting_order(
            quantity=10,
            delivery_time=later_delivery,
        )

        self.batch.remaining_quantity = 15
        self.batch.save(update_fields=["remaining_quantity"])

        allocated = try_allocate_waiting_orders(
            dealer_product_id=self.dealer_product.id,
            user=self.dealer_user,
        )
        self.assertEqual(len(allocated), 1)

        order_early.refresh_from_db()
        order_late.refresh_from_db()
        self.assertEqual(order_early.status, OrderStatus.PROCESSING)
        self.assertEqual(order_late.status, OrderStatus.WAITING_STOCK)
        self.assertIsNotNone(order_early.items.first().batch)
        self.assertIsNone(order_late.items.first().batch)


class DeliveryRescheduleTests(PreOrderFlowTestBase):
    def test_dealer_propose_customer_accept_updates_delivery(self):
        order = self._create_waiting_order(quantity=20)
        new_delivery = resolve_delivery_time(date(2026, 6, 22), "afternoon")

        delivery_reschedule_services.dealer_propose_delivery_reschedule(
            order,
            self.dealer_user,
            proposed_delivery_time=new_delivery,
            reason="Hàng về trễ",
        )
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.DELIVERY_RESCHEDULE_PROPOSED)

        order = delivery_reschedule_services.customer_accept_delivery_reschedule(
            order,
            self.buyer_user,
        )
        self.assertEqual(order.status, OrderStatus.WAITING_STOCK)
        self.assertEqual(order.delivery_time, new_delivery)
        self.assertIsNone(order.proposed_delivery_time)

    def test_customer_reject_reschedule_cancels_waiting_order(self):
        order = self._create_waiting_order(quantity=20)
        new_delivery = resolve_delivery_time(date(2026, 6, 22), "afternoon")

        delivery_reschedule_services.dealer_propose_delivery_reschedule(
            order,
            self.dealer_user,
            proposed_delivery_time=new_delivery,
            reason="Hàng về trễ",
        )
        order = delivery_reschedule_services.customer_reject_delivery_reschedule(
            order,
            self.buyer_user,
            reason="Không nhận ngày mới",
        )
        self.assertEqual(order.status, OrderStatus.CANCELLED)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_quantity, 10)

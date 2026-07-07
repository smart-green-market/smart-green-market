"""Test realtime (WebSocket push + notification) cho TOÀN BỘ luồng B2C (đơn buyer).

Mọi bước chuyển trạng thái của Order đều phải:
1. Tạo NotificationReceipt cho bên còn lại (buyer <-> dealer) với
   reference_type="customer_order", reference_id=order.id đúng trạng thái mới.
2. Gọi push_notification_to_account() (kênh WebSocket realtime) — đây là điều
   kiện để FE (web buyer/dealer + mobile buyer) nhận cập nhật tức thời qua
   `useOrderRealtimeRefresh` / `OrderStatusRealtimeController` mà không cần
   chờ vòng polling kế tiếp.

`cancel_requested` và `delivery_failed` không được test ở đây vì hiện chưa có
service nào gán các giá trị này cho Order.status (chỉ tồn tại trong enum).
"""

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
    CustomerPayment,
    CustomerPaymentMethod,
    CustomerPaymentStatus,
    CustomerPaymentType,
    Order,
    OrderItem,
    OrderStatus,
)
from apps.orders.services import (
    buyer_confirm_received,
    buyer_request_return,
    cancel_customer_order,
    dealer_confirm_order,
    dealer_review_return,
    dealer_start_processing,
    dealer_start_shipping,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class CustomerOrderRealtimeTestBase(TestCase):
    """Setup chung: 1 dealer, 1 buyer, 1 sản phẩm còn tồn kho."""

    def setUp(self):
        self.push_patcher = patch("common.notifications.push_notification_to_account")
        self.mock_push = self.push_patcher.start()
        self.addCleanup(self.push_patcher.stop)

        self.now = timezone.now()

        dealer_account = Account.objects.create_user(
            username=f"dealer_co_rt_{self._testMethodName}",
            email=f"dealer_co_rt_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store CO RT",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        buyer_account = Account.objects.create_user(
            username=f"buyer_co_rt_{self._testMethodName}",
            email=f"buyer_co_rt_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.customer = CustomerProfile.objects.create(user=buyer_account)
        self.buyer_user = buyer_account
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            receiver_name="Buyer RT",
            receiver_phone="0900111222",
            address="123 Test St",
            is_default=True,
        )

        supplier_account = Account.objects.create_user(
            username=f"sup_co_rt_{self._testMethodName}",
            email=f"sup_co_rt_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC CO RT",
            tax_code=f"TAX-CO-{self._testMethodName}"[:50],
            phone="0900000000",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name=f"Rau CO RT {self._testMethodName}",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="Rau CO RT",
            slug=f"rau-co-rt-{self._testMethodName}",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.dealer_product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            title="Rau bán lẻ CO RT",
            retail_price="15000.00",
            status=DealerProductStatus.ACTIVE,
        )
        self.batch = DealerInventoryBatch.objects.create(
            dealer_product=self.dealer_product,
            batch_number=f"B-CO-RT-{self._testMethodName}",
            quantity=20,
            remaining_quantity=17,
            import_price="10000.00",
            import_date=self.now.date(),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

    def _create_pending_order(self, quantity=3):
        order = Order.objects.create(
            order_code=f"DH-T-{Order.objects.count() + 1}",
            customer=self.customer,
            dealer=self.dealer,
            customer_address=self.address,
            status=OrderStatus.PENDING,
            receiver_name=self.address.receiver_name,
            receiver_phone=self.address.receiver_phone,
            delivery_address=self.address.address,
            delivery_time=self.now,
            subtotal_amount=Decimal("45000.00"),
            total_amount=Decimal("45000.00"),
            debt_amount=Decimal("45000.00"),
        )
        OrderItem.objects.create(
            order=order,
            dealer_product=self.dealer_product,
            batch=self.batch,
            product_title=self.dealer_product.title,
            unit="kg",
            quantity=quantity,
            unit_price=Decimal("15000.00"),
            import_price=Decimal("10000.00"),
            subtotal=Decimal("45000.00"),
        )
        CustomerPayment.objects.create(
            order=order,
            payment_method=CustomerPaymentMethod.CASH,
            payment_type=CustomerPaymentType.COD,
            amount=Decimal("45000.00"),
            status=CustomerPaymentStatus.PENDING,
        )
        return order

    def assert_realtime_notified(self, order, *, expected_status, target_account_id):
        """Assert: có NotificationReceipt cho target + WS push đã được gọi cho account đó."""
        receipt = (
            NotificationReceipt.objects.filter(
                account_id=target_account_id,
                notification__reference_type="customer_order",
                notification__reference_id=order.id,
            )
            .order_by("-id")
            .first()
        )
        self.assertIsNotNone(
            receipt,
            msg=f"Không tìm thấy NotificationReceipt cho account={target_account_id} "
            f"khi status={expected_status}",
        )

        order.refresh_from_db()
        self.assertEqual(order.status, expected_status)

        pushed_account_ids = [call.args[0] for call in self.mock_push.call_args_list]
        self.assertIn(
            target_account_id,
            pushed_account_ids,
            msg=f"push_notification_to_account KHÔNG được gọi cho account={target_account_id} "
            f"khi status={expected_status} — buyer/dealer sẽ KHÔNG nhận realtime.",
        )


class CustomerOrderHappyPathRealtimeTests(CustomerOrderRealtimeTestBase):
    """pending -> confirmed -> processing -> shipping -> completed."""

    def test_dealer_confirm_notifies_buyer(self):
        order = self._create_pending_order()
        self.mock_push.reset_mock()
        dealer_confirm_order(order, self.dealer_user)
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.CONFIRMED,
            target_account_id=self.buyer_user.id,
        )

    def test_dealer_start_processing_notifies_buyer(self):
        order = self._create_pending_order()
        dealer_confirm_order(order, self.dealer_user)
        self.mock_push.reset_mock()
        dealer_start_processing(order, self.dealer_user)
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.PROCESSING,
            target_account_id=self.buyer_user.id,
        )

    def test_dealer_ship_notifies_buyer(self):
        order = self._create_pending_order()
        dealer_confirm_order(order, self.dealer_user)
        dealer_start_processing(order, self.dealer_user)
        self.mock_push.reset_mock()
        dealer_start_shipping(order, self.dealer_user)
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.SHIPPING,
            target_account_id=self.buyer_user.id,
        )

    def _advance_to_shipping(self):
        order = self._create_pending_order()
        dealer_confirm_order(order, self.dealer_user)
        dealer_start_processing(order, self.dealer_user)
        dealer_start_shipping(order, self.dealer_user)
        return order

    def test_buyer_confirm_received_notifies_dealer(self):
        order = self._advance_to_shipping()
        self.mock_push.reset_mock()
        buyer_confirm_received(order, self.buyer_user)
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.COMPLETED,
            target_account_id=self.dealer_user.id,
        )


class CustomerOrderTerminalBranchRealtimeTests(CustomerOrderRealtimeTestBase):
    """Hủy đơn + luồng trả hàng (duyệt / từ chối)."""

    def test_buyer_cancel_notifies_dealer(self):
        order = self._create_pending_order()
        self.mock_push.reset_mock()
        cancel_customer_order(order, self.buyer_user, reason="Đổi ý", actor="buyer")
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.CANCELLED,
            target_account_id=self.dealer_user.id,
        )

    def test_dealer_cancel_notifies_buyer(self):
        order = self._create_pending_order()
        self.mock_push.reset_mock()
        cancel_customer_order(order, self.dealer_user, reason="Hết hàng", actor="dealer")
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.CANCELLED,
            target_account_id=self.buyer_user.id,
        )

    def _advance_to_completed(self):
        order = self._create_pending_order()
        dealer_confirm_order(order, self.dealer_user)
        dealer_start_processing(order, self.dealer_user)
        dealer_start_shipping(order, self.dealer_user)
        buyer_confirm_received(order, self.buyer_user)
        return order

    def test_buyer_request_return_notifies_dealer(self):
        order = self._advance_to_completed()
        self.mock_push.reset_mock()
        buyer_request_return(order, self.buyer_user, reason="Hàng hỏng")
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.RETURN_REQUESTED,
            target_account_id=self.dealer_user.id,
        )

    def test_dealer_approve_return_notifies_buyer_returned(self):
        order = self._advance_to_completed()
        order_return = buyer_request_return(order, self.buyer_user, reason="Hàng hỏng")
        self.mock_push.reset_mock()
        dealer_review_return(order_return, self.dealer_user, approved=True)
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.RETURNED,
            target_account_id=self.buyer_user.id,
        )

    def test_dealer_reject_return_notifies_buyer_back_to_completed(self):
        order = self._advance_to_completed()
        order_return = buyer_request_return(order, self.buyer_user, reason="Hàng hỏng")
        self.mock_push.reset_mock()
        dealer_review_return(
            order_return, self.dealer_user, approved=False, review_note="Không hợp lệ"
        )
        self.assert_realtime_notified(
            order,
            expected_status=OrderStatus.COMPLETED,
            target_account_id=self.buyer_user.id,
        )


class CustomerOrderActorExclusionTests(CustomerOrderRealtimeTestBase):
    """Actor tự thao tác không cần nhận lại thông báo về chính hành động của mình."""

    def test_actor_excluded_from_notification_targets(self):
        order = self._create_pending_order()
        self.mock_push.reset_mock()
        # dealer_user tự xác nhận đơn -> không tự nhận notification của chính mình
        dealer_confirm_order(order, self.dealer_user)
        self.assertFalse(
            NotificationReceipt.objects.filter(
                account_id=self.dealer_user.id,
                notification__reference_type="customer_order",
                notification__reference_id=order.id,
            ).exists()
        )
        pushed_account_ids = [call.args[0] for call in self.mock_push.call_args_list]
        self.assertNotIn(self.dealer_user.id, pushed_account_ids)

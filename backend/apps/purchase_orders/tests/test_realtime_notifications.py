"""Test realtime (WebSocket push + notification) cho TOÀN BỘ luồng B2B (phiếu nhập hàng).

Mọi bước chuyển trạng thái của PurchaseOrder đều phải:
1. Tạo NotificationReceipt cho bên còn lại (dealer <-> supplier) với
   reference_type="purchase_order", reference_id=order.id đúng trạng thái mới.
2. Gọi push_notification_to_account() (kênh WebSocket realtime) — đây là điều
   kiện để FE (web dealer/supplier) nhận cập nhật tức thời qua
   `useOrderRealtimeRefresh` mà không cần polling.

Các trạng thái không bao giờ được gán cho PurchaseOrder.status trong nghiệp vụ
hiện tại (deposit_paid, return_approved, return_rejected — chỉ tồn tại trong
enum nhưng chưa được service nào set) sẽ không được test ở đây.
"""

from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.notifications.models import NotificationReceipt
from apps.purchase_orders.models import (
    PurchaseOrderPaymentType,
    PurchaseOrderStatus,
)
from apps.purchase_orders.services import (
    cancel_order,
    create_purchase_order,
    dealer_request_return,
    dealer_submit_payment,
    supplier_confirm_order,
    supplier_reject_order,
    supplier_review_return,
    supplier_start_shipping,
    supplier_verify_payment,
    dealer_confirm_delivery,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class PurchaseOrderRealtimeTestBase(TestCase):
    """Setup chung: 1 dealer, 1 supplier, 1 sản phẩm — dùng cho mọi test case."""

    def setUp(self):
        self.push_patcher = patch("common.notifications.push_notification_to_account")
        self.mock_push = self.push_patcher.start()
        self.addCleanup(self.push_patcher.stop)

        dealer_account = Account.objects.create_user(
            username=f"dealer_rt_{self._testMethodName}",
            email=f"dealer_rt_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store RT",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        supplier_account = Account.objects.create_user(
            username=f"sup_rt_{self._testMethodName}",
            email=f"sup_rt_{self._testMethodName}@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC RT",
            tax_code=f"TAX-{self._testMethodName}"[:50],
            phone="0900000000",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.supplier_user = supplier_account

        category = Category.objects.create(
            name=f"Rau RT {self._testMethodName}",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Rau RT",
            slug=f"rau-rt-{self._testMethodName}",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )

    def _create_order(self, quantity=Decimal("100")):
        return create_purchase_order(
            dealer_profile=self.dealer,
            supplier=self.supplier,
            delivery_data={
                "delivery_address": "Kho dealer",
                "requested_delivery_time": timezone.now() + timezone.timedelta(days=5),
                "receiver_name": "Dealer",
                "receiver_phone": "0900000000",
                "note": "",
            },
            items_data=[
                {"supplier_product": self.product, "quantity": quantity, "note": ""}
            ],
            user=self.dealer_user,
        )

    def assert_realtime_notified(self, order, *, expected_status, target_account_id):
        """Assert: có NotificationReceipt cho target + WS push đã được gọi cho account đó."""
        receipt = (
            NotificationReceipt.objects.filter(
                account_id=target_account_id,
                notification__reference_type="purchase_order",
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
            f"khi status={expected_status} — dealer/supplier sẽ KHÔNG nhận realtime.",
        )


class PurchaseOrderHappyPathRealtimeTests(PurchaseOrderRealtimeTestBase):
    """Luồng thành công: pending -> confirmed -> deposit -> processing -> shipping
    -> delivered -> final_payment -> completed. Mỗi bước phải bắn realtime cho
    bên còn lại (không phải actor vừa thao tác)."""

    def test_create_order_notifies_supplier(self):
        order = self._create_order()
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
            target_account_id=self.supplier_user.id,
        )

    def test_supplier_confirm_notifies_dealer(self):
        order = self._create_order()
        self.mock_push.reset_mock()
        supplier_confirm_order(
            order,
            self.supplier_user,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=order.requested_delivery_time,
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.CONFIRMED,
            target_account_id=self.dealer_user.id,
        )

    def test_dealer_submit_deposit_notifies_supplier(self):
        order = self._create_order()
        supplier_confirm_order(
            order,
            self.supplier_user,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=order.requested_delivery_time,
        )
        self.mock_push.reset_mock()
        dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.DEPOSIT,
            {"payment_method": "bank_transfer"},
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.DEPOSIT_PENDING_VERIFICATION,
            target_account_id=self.supplier_user.id,
        )

    def test_supplier_verify_deposit_notifies_dealer_processing(self):
        order = self._create_order()
        supplier_confirm_order(
            order,
            self.supplier_user,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=order.requested_delivery_time,
        )
        payment = dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.DEPOSIT,
            {"payment_method": "bank_transfer"},
        )
        self.mock_push.reset_mock()
        supplier_verify_payment(payment, self.supplier_user, approved=True)
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.PROCESSING,
            target_account_id=self.dealer_user.id,
        )

    def test_supplier_reject_deposit_notifies_dealer_back_to_confirmed(self):
        order = self._create_order()
        supplier_confirm_order(
            order,
            self.supplier_user,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=order.requested_delivery_time,
        )
        payment = dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.DEPOSIT,
            {"payment_method": "bank_transfer"},
        )
        self.mock_push.reset_mock()
        supplier_verify_payment(
            payment, self.supplier_user, approved=False, rejection_reason="Sai số tiền"
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.CONFIRMED,
            target_account_id=self.dealer_user.id,
        )

    def _advance_to_processing(self):
        order = self._create_order()
        supplier_confirm_order(
            order,
            self.supplier_user,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=order.requested_delivery_time,
        )
        payment = dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.DEPOSIT,
            {"payment_method": "bank_transfer"},
        )
        supplier_verify_payment(payment, self.supplier_user, approved=True)
        return order

    def test_supplier_ship_notifies_dealer(self):
        order = self._advance_to_processing()
        self.mock_push.reset_mock()
        supplier_start_shipping(order, self.supplier_user)
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.SHIPPING,
            target_account_id=self.dealer_user.id,
        )

    def test_dealer_confirm_delivery_notifies_supplier(self):
        order = self._advance_to_processing()
        supplier_start_shipping(order, self.supplier_user)
        self.mock_push.reset_mock()
        dealer_confirm_delivery(order, self.dealer_user)
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.DELIVERED,
            target_account_id=self.supplier_user.id,
        )

    def _advance_to_delivered(self):
        order = self._advance_to_processing()
        supplier_start_shipping(order, self.supplier_user)
        dealer_confirm_delivery(order, self.dealer_user)
        return order

    def test_dealer_submit_final_payment_notifies_supplier(self):
        order = self._advance_to_delivered()
        self.mock_push.reset_mock()
        dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.FINAL_PAYMENT,
            {"payment_method": "bank_transfer"},
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.FINAL_PAYMENT_PENDING_VERIFICATION,
            target_account_id=self.supplier_user.id,
        )

    def test_supplier_verify_final_payment_notifies_dealer_completed(self):
        order = self._advance_to_delivered()
        payment = dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.FINAL_PAYMENT,
            {"payment_method": "bank_transfer"},
        )
        self.mock_push.reset_mock()
        supplier_verify_payment(payment, self.supplier_user, approved=True)
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.COMPLETED,
            target_account_id=self.dealer_user.id,
        )

    def test_supplier_reject_final_payment_notifies_dealer_back_to_delivered(self):
        order = self._advance_to_delivered()
        payment = dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.FINAL_PAYMENT,
            {"payment_method": "bank_transfer"},
        )
        self.mock_push.reset_mock()
        supplier_verify_payment(
            payment, self.supplier_user, approved=False, rejection_reason="Thiếu tiền"
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.DELIVERED,
            target_account_id=self.dealer_user.id,
        )


class PurchaseOrderTerminalBranchRealtimeTests(PurchaseOrderRealtimeTestBase):
    """Các nhánh kết thúc/rẽ nhánh: từ chối, hủy, trả hàng (toàn phần & một phần)."""

    def test_supplier_reject_notifies_dealer(self):
        order = self._create_order()
        self.mock_push.reset_mock()
        supplier_reject_order(order, self.supplier_user, "Hết hàng")
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.REJECTED,
            target_account_id=self.dealer_user.id,
        )

    def test_dealer_cancel_notifies_supplier(self):
        order = self._create_order()
        self.mock_push.reset_mock()
        cancel_order(order, self.dealer_user, note="Đổi ý")
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.CANCELLED,
            target_account_id=self.supplier_user.id,
        )

    def _advance_to_delivered(self):
        order = self._create_order()
        supplier_confirm_order(
            order,
            self.supplier_user,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=order.requested_delivery_time,
        )
        payment = dealer_submit_payment(
            order,
            self.dealer_user,
            PurchaseOrderPaymentType.DEPOSIT,
            {"payment_method": "bank_transfer"},
        )
        supplier_verify_payment(payment, self.supplier_user, approved=True)
        supplier_start_shipping(order, self.supplier_user)
        dealer_confirm_delivery(order, self.dealer_user)
        return order

    def test_dealer_request_return_notifies_supplier(self):
        order = self._advance_to_delivered()
        item = order.items.first()
        self.mock_push.reset_mock()
        dealer_request_return(
            order,
            self.dealer_user,
            reason="Hàng hỏng",
            items=[{"purchase_order_item_id": item.id, "quantity": Decimal("50"), "reason": ""}],
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.RETURN_REQUESTED,
            target_account_id=self.supplier_user.id,
        )

    def test_supplier_approve_partial_return_notifies_dealer_back_to_delivered(self):
        order = self._advance_to_delivered()
        item = order.items.first()
        po_return = dealer_request_return(
            order,
            self.dealer_user,
            reason="Hàng hỏng một phần",
            items=[{"purchase_order_item_id": item.id, "quantity": Decimal("50"), "reason": ""}],
        )
        self.mock_push.reset_mock()
        supplier_review_return(po_return, self.supplier_user, approved=True)
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.DELIVERED,
            target_account_id=self.dealer_user.id,
        )

    def test_supplier_approve_full_return_notifies_dealer_returned(self):
        order = self._advance_to_delivered()
        item = order.items.first()
        po_return = dealer_request_return(
            order,
            self.dealer_user,
            reason="Trả hết",
            items=[{"purchase_order_item_id": item.id, "quantity": Decimal("100"), "reason": ""}],
        )
        self.mock_push.reset_mock()
        supplier_review_return(po_return, self.supplier_user, approved=True)
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.RETURNED,
            target_account_id=self.dealer_user.id,
        )

    def test_supplier_reject_return_notifies_dealer_back_to_delivered(self):
        order = self._advance_to_delivered()
        item = order.items.first()
        po_return = dealer_request_return(
            order,
            self.dealer_user,
            reason="Hàng hỏng",
            items=[{"purchase_order_item_id": item.id, "quantity": Decimal("50"), "reason": ""}],
        )
        self.mock_push.reset_mock()
        supplier_review_return(
            po_return, self.supplier_user, approved=False, review_note="Không hợp lệ"
        )
        self.assert_realtime_notified(
            order,
            expected_status=PurchaseOrderStatus.DELIVERED,
            target_account_id=self.dealer_user.id,
        )


class PurchaseOrderActorExclusionTests(PurchaseOrderRealtimeTestBase):
    """Actor tự thao tác không cần nhận lại thông báo về chính hành động của mình."""

    def test_actor_excluded_from_notification_targets(self):
        order = self._create_order()
        # dealer_user vừa tạo đơn -> không tự nhận notification của chính mình
        self.assertFalse(
            NotificationReceipt.objects.filter(
                account_id=self.dealer_user.id,
                notification__reference_type="purchase_order",
                notification__reference_id=order.id,
            ).exists()
        )
        pushed_account_ids = [call.args[0] for call in self.mock_push.call_args_list]
        self.assertNotIn(self.dealer_user.id, pushed_account_ids)

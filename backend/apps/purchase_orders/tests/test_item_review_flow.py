"""Tests duyệt dòng SP và luồng chờ dealer khi NCC điều chỉnh."""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.notifications.models import NotificationReceipt
from apps.purchase_orders.models import (
    PurchaseOrderItemReviewStatus,
    PurchaseOrderStatus,
)
from apps.purchase_orders.services import (
    cancel_order,
    create_purchase_order,
    dealer_approve_adjustment,
    supplier_confirm_order,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class ItemReviewFlowTests(TestCase):
    def setUp(self):
        self.dealer_account = Account.objects.create_user(
            username="dealer_item_review",
            email="dealer_item_review@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier_account = Account.objects.create_user(
            username="supplier_item_review",
            email="supplier_item_review@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=self.dealer_account,
            store_name="Store Review",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=self.supplier_account,
            company_name="NCC Review",
            tax_code="0123456701",
            phone="0900000001",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau Review",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product_a = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Rau A",
            slug="rau-a-review",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.product_b = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Rau B",
            slug="rau-b-review",
            unit="kg",
            wholesale_price=Decimal("8000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.requested_time = timezone.now() + timedelta(days=10)
        self.order = create_purchase_order(
            dealer_profile=self.dealer,
            supplier=self.supplier,
            delivery_data={
                "delivery_address": "Kho dealer",
                "requested_delivery_time": self.requested_time,
                "receiver_name": "Dealer User",
                "receiver_phone": "0901111222",
                "note": "",
            },
            items_data=[
                {
                    "supplier_product": self.product_a,
                    "quantity": Decimal("100"),
                    "note": "",
                },
                {
                    "supplier_product": self.product_b,
                    "quantity": Decimal("50"),
                    "note": "",
                },
            ],
            user=self.dealer_account,
        )

    def test_confirm_unchanged_goes_confirmed(self):
        supplier_confirm_order(
            self.order,
            self.supplier_account,
            deposit_percent=Decimal("30"),
            confirmed_delivery_time=self.requested_time,
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.CONFIRMED)
        for item in self.order.items.all():
            self.assertEqual(item.review_status, PurchaseOrderItemReviewStatus.APPROVED)

    def test_confirm_delivery_change_waits_dealer(self):
        confirmed = timezone.now() + timedelta(days=4)
        supplier_confirm_order(
            self.order,
            self.supplier_account,
            confirmed_delivery_time=confirmed,
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION)
        self.assertTrue(
            NotificationReceipt.objects.filter(
                account=self.dealer_account,
                notification__title__icontains="Cần xác nhận điều chỉnh",
            ).exists()
        )

    def test_confirm_partial_reject_waits_dealer(self):
        items = list(self.order.items.order_by("id"))
        supplier_confirm_order(
            self.order,
            self.supplier_account,
            confirmed_delivery_time=self.requested_time,
            items_data=[
                {
                    "id": items[0].id,
                    "review_status": PurchaseOrderItemReviewStatus.APPROVED,
                },
                {
                    "id": items[1].id,
                    "review_status": PurchaseOrderItemReviewStatus.REJECTED,
                    "rejection_reason": "Hết hàng",
                },
            ],
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION)
        self.assertEqual(self.order.total_amount, Decimal("1000000"))
        items[1].refresh_from_db()
        self.assertEqual(items[1].quantity, Decimal("0"))

    def test_dealer_approve_adjustment_then_confirmed(self):
        supplier_confirm_order(
            self.order,
            self.supplier_account,
            confirmed_delivery_time=timezone.now() + timedelta(days=3),
        )
        dealer_approve_adjustment(self.order, self.dealer_account)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.CONFIRMED)

    def test_dealer_cancel_from_pending_dealer_confirmation(self):
        supplier_confirm_order(
            self.order,
            self.supplier_account,
            confirmed_delivery_time=timezone.now() + timedelta(days=3),
        )
        cancel_order(self.order, self.dealer_account, note="Không đồng ý ngày giao")
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.CANCELLED)

    def test_confirm_quantity_change_waits_dealer(self):
        item = self.order.items.first()
        supplier_confirm_order(
            self.order,
            self.supplier_account,
            confirmed_delivery_time=self.requested_time,
            items_data=[
                {
                    "id": item.id,
                    "review_status": PurchaseOrderItemReviewStatus.APPROVED,
                    "quantity": Decimal("80"),
                },
                {
                    "id": self.order.items.exclude(id=item.id).first().id,
                    "review_status": PurchaseOrderItemReviewStatus.APPROVED,
                },
            ],
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION)
        item.refresh_from_db()
        self.assertEqual(item.quantity, Decimal("80"))

    def test_all_items_rejected_fails(self):
        items = list(self.order.items.order_by("id"))
        with self.assertRaises(ValidationError):
            supplier_confirm_order(
                self.order,
                self.supplier_account,
                confirmed_delivery_time=self.requested_time,
                items_data=[
                    {
                        "id": items[0].id,
                        "review_status": PurchaseOrderItemReviewStatus.REJECTED,
                        "rejection_reason": "Hết",
                    },
                    {
                        "id": items[1].id,
                        "review_status": PurchaseOrderItemReviewStatus.REJECTED,
                        "rejection_reason": "Hết",
                    },
                ],
            )


class ItemReviewApiTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_item_api",
            email="dealer_item_api@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_item_api",
            email="supplier_item_api@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store API",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC API",
            tax_code="0123456702",
            phone="0900000002",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau API2",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        sp = SupplierProduct.objects.create(
            supplier=supplier,
            category=category,
            name="SP API2",
            slug="sp-api2-review",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        self.requested_time = timezone.now() + timedelta(days=10)
        self.order = create_purchase_order(
            dealer_profile=self.dealer,
            supplier=supplier,
            delivery_data={
                "delivery_address": "Kho",
                "requested_delivery_time": self.requested_time,
                "receiver_name": "A",
                "receiver_phone": "090",
                "note": "",
            },
            items_data=[{"supplier_product": sp, "quantity": Decimal("50"), "note": ""}],
            user=dealer_account,
        )
        self.supplier_client = APIClient()
        self.supplier_client.force_authenticate(user=supplier_account)
        self.dealer_client = APIClient()
        self.dealer_client.force_authenticate(user=dealer_account)

    def test_api_approve_adjustment(self):
        confirmed = (timezone.now() + timedelta(days=3)).isoformat()
        self.supplier_client.post(
            f"/api/purchase-orders/{self.order.id}/confirm/",
            {"confirmed_delivery_time": confirmed},
            format="json",
        )
        response = self.dealer_client.post(
            f"/api/purchase-orders/{self.order.id}/approve-adjustment/",
            {"note": "OK"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], PurchaseOrderStatus.CONFIRMED)

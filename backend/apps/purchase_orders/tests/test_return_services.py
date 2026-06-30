"""Tests trả hàng phiếu nhập — trả theo số lượng từng dòng."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
)
from apps.purchase_orders.services import (
    dealer_request_return,
    supplier_review_return,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class PurchaseOrderPartialReturnTests(TestCase):
    def setUp(self):
        self.now = timezone.now()

        dealer_account = Account.objects.create_user(
            username="dealer_po_return",
            email="dealer_po_return@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store PO Return",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        supplier_account = Account.objects.create_user(
            username="sup_po_return",
            email="sup_po_return@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC PO Return",
            tax_code="4444444444",
            phone="0900000004",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.supplier_user = supplier_account

        category = Category.objects.create(
            name="Rau PO Return",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product_a = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Cà chua PO",
            slug="ca-chua-po-return",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        self.product_b = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Dưa leo PO",
            slug="dua-leo-po-return",
            unit="kg",
            wholesale_price="8000.00",
            status=SupplierProductStatus.ACTIVE,
        )

        self.order = PurchaseOrder.objects.create(
            order_code="PN-TEST-RETURN-001",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.DELIVERED,
            delivery_address="Addr",
            requested_delivery_time=self.now,
            receiver_name="Test",
            receiver_phone="0900000000",
            total_amount=Decimal("180000"),
            deposit_amount=Decimal("54000"),
            paid_amount=Decimal("54000"),
            debt_amount=Decimal("126000"),
            delivered_at=self.now,
        )
        self.item_a = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=self.product_a,
            quantity=Decimal("10"),
            unit_price=Decimal("10000"),
            subtotal=Decimal("100000"),
        )
        self.item_b = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=self.product_b,
            quantity=Decimal("10"),
            unit_price=Decimal("8000"),
            subtotal=Decimal("80000"),
        )

    def test_partial_return_single_line(self):
        po_return = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Hàng hỏng một phần",
            items=[
                {
                    "purchase_order_item_id": self.item_a.id,
                    "quantity": Decimal("4"),
                    "reason": "Hỏng 4kg",
                }
            ],
        )

        self.assertEqual(po_return.refund_amount, Decimal("40000.00"))
        self.assertEqual(po_return.items.count(), 1)
        self.assertEqual(self.order.status, PurchaseOrderStatus.RETURN_REQUESTED)

        supplier_review_return(po_return, self.supplier_user, approved=True)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.DELIVERED)
        self.assertEqual(self.order.total_amount, Decimal("140000"))
        self.assertEqual(self.order.debt_amount, Decimal("86000"))

    def test_full_return_all_lines_sets_returned_status(self):
        po_return = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Trả hết",
            items=[
                {
                    "purchase_order_item_id": self.item_a.id,
                    "quantity": Decimal("10"),
                    "reason": "",
                },
                {
                    "purchase_order_item_id": self.item_b.id,
                    "quantity": Decimal("10"),
                    "reason": "",
                },
            ],
        )

        supplier_review_return(po_return, self.supplier_user, approved=True)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.RETURNED)
        self.assertEqual(self.order.total_amount, Decimal("0"))
        self.assertEqual(self.order.debt_amount, Decimal("0"))

    def test_second_partial_return_after_first_approved(self):
        first = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Lần 1",
            items=[
                {
                    "purchase_order_item_id": self.item_a.id,
                    "quantity": Decimal("4"),
                    "reason": "",
                }
            ],
        )
        supplier_review_return(first, self.supplier_user, approved=True)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.DELIVERED)

        second = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Lần 2",
            items=[
                {
                    "purchase_order_item_id": self.item_a.id,
                    "quantity": Decimal("6"),
                    "reason": "",
                }
            ],
        )
        supplier_review_return(second, self.supplier_user, approved=True)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.DELIVERED)
        self.assertEqual(self.order.total_amount, Decimal("80000"))

    def test_rejects_quantity_over_returnable(self):
        with self.assertRaises(ValidationError):
            dealer_request_return(
                self.order,
                self.dealer_user,
                reason="Vượt SL",
                items=[
                    {
                        "purchase_order_item_id": self.item_a.id,
                        "quantity": Decimal("11"),
                        "reason": "",
                    }
                ],
            )

    def test_rejects_when_pending_return_exists(self):
        dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Chờ duyệt",
            items=[
                {
                    "purchase_order_item_id": self.item_a.id,
                    "quantity": Decimal("1"),
                    "reason": "",
                }
            ],
        )
        with self.assertRaises(ValidationError):
            dealer_request_return(
                self.order,
                self.dealer_user,
                reason="Trùng yêu cầu",
                items=[
                    {
                        "purchase_order_item_id": self.item_b.id,
                        "quantity": Decimal("1"),
                        "reason": "",
                    }
                ],
            )

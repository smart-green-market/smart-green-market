"""Tests computed return_status trên dòng phiếu nhập."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.item_return_status import (
    RETURN_STATUS_FULL,
    RETURN_STATUS_NONE,
    RETURN_STATUS_PARTIAL,
    RETURN_STATUS_REQUESTED,
    build_purchase_order_item_return_info,
)
from apps.purchase_orders.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderItemReviewStatus,
    PurchaseOrderReturn,
    PurchaseOrderReturnItem,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
)
from apps.purchase_orders.serializers import PurchaseOrderItemReadSerializer
from apps.purchase_orders.services import dealer_request_return, supplier_review_return
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class PurchaseOrderItemReturnStatusTests(TestCase):
    def setUp(self):
        self.now = timezone.now()

        dealer_account = Account.objects.create_user(
            username="dealer_item_return",
            email="dealer_item_return@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Item Return",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        supplier_account = Account.objects.create_user(
            username="sup_item_return",
            email="sup_item_return@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Item Return",
            tax_code="5555555555",
            phone="0900000005",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.supplier_user = supplier_account

        category = Category.objects.create(
            name="Rau Item Return",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Rau muống",
            slug="rau-muong-item-return",
            unit="kg",
            wholesale_price="12000.00",
            status=SupplierProductStatus.ACTIVE,
        )

        self.order = PurchaseOrder.objects.create(
            order_code="PN-ITEM-RETURN-001",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.DELIVERED,
            delivery_address="Addr",
            requested_delivery_time=self.now,
            receiver_name="Test",
            receiver_phone="0900000000",
            total_amount=Decimal("120000"),
            deposit_percent=Decimal("30"),
            deposit_amount=Decimal("36000"),
            paid_amount=Decimal("36000"),
            debt_amount=Decimal("84000"),
            credit_amount=Decimal("0"),
            delivered_at=self.now,
        )
        self.item = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=product,
            quantity=Decimal("10"),
            original_quantity=Decimal("10"),
            unit_price=Decimal("12000"),
            base_unit_price=Decimal("12000"),
            subtotal=Decimal("120000"),
            review_status=PurchaseOrderItemReviewStatus.APPROVED,
        )

    def test_none_when_no_returns(self):
        info = build_purchase_order_item_return_info(self.item)
        self.assertEqual(info["return_status"], RETURN_STATUS_NONE)
        self.assertEqual(info["returnable_quantity"], Decimal("10"))

    def test_return_requested_while_pending(self):
        po_return = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Hàng hỏng",
            items=[
                {
                    "purchase_order_item_id": self.item.id,
                    "quantity": Decimal("3"),
                    "reason": "Hỏng",
                }
            ],
        )
        self.item.refresh_from_db()
        info = build_purchase_order_item_return_info(self.item)
        self.assertEqual(info["return_status"], RETURN_STATUS_REQUESTED)
        self.assertEqual(info["pending_return_quantity"], Decimal("3"))
        self.assertEqual(info["returnable_quantity"], Decimal("10"))
        self.assertIsNotNone(po_return)

    def test_partially_returned_after_approval(self):
        po_return = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Hàng hỏng",
            items=[
                {
                    "purchase_order_item_id": self.item.id,
                    "quantity": Decimal("4"),
                    "reason": "",
                }
            ],
        )
        supplier_review_return(po_return, self.supplier_user, approved=True)
        self.item.refresh_from_db()
        info = build_purchase_order_item_return_info(self.item)
        self.assertEqual(info["return_status"], RETURN_STATUS_PARTIAL)
        self.assertEqual(info["returned_quantity"], Decimal("4"))
        self.assertEqual(info["returnable_quantity"], Decimal("6"))

    def test_fully_returned_when_all_qty_approved(self):
        po_return = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Trả hết",
            items=[
                {
                    "purchase_order_item_id": self.item.id,
                    "quantity": Decimal("10"),
                    "reason": "",
                }
            ],
        )
        supplier_review_return(po_return, self.supplier_user, approved=True)
        self.item.refresh_from_db()
        info = build_purchase_order_item_return_info(self.item)
        self.assertEqual(info["return_status"], RETURN_STATUS_FULL)
        self.assertEqual(info["returnable_quantity"], Decimal("0"))

    def test_rejected_line_has_no_return_status(self):
        self.item.review_status = PurchaseOrderItemReviewStatus.REJECTED
        self.item.save(update_fields=["review_status"])
        info = build_purchase_order_item_return_info(self.item)
        self.assertEqual(info["return_status"], RETURN_STATUS_NONE)
        self.assertEqual(info["returnable_quantity"], Decimal("0"))

    def test_serializer_exposes_return_fields(self):
        po_return = PurchaseOrderReturn.objects.create(
            purchase_order=self.order,
            status=PurchaseOrderReturnStatus.REQUESTED,
            reason="Test",
            requested_by=self.dealer_user,
            refund_amount=Decimal("36000"),
        )
        PurchaseOrderReturnItem.objects.create(
            purchase_order_return=po_return,
            purchase_order_item=self.item,
            quantity=Decimal("3"),
            reason="Hỏng",
        )
        data = PurchaseOrderItemReadSerializer(self.item).data
        self.assertEqual(data["return_status"], RETURN_STATUS_REQUESTED)
        self.assertEqual(data["return_status_label"], "Chờ duyệt trả hàng")
        self.assertEqual(Decimal(str(data["pending_return_quantity"])), Decimal("3"))
        self.assertIn("returnable_quantity", data)

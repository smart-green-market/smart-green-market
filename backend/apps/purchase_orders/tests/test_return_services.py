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
    PurchaseOrderItemReviewStatus,
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
            deposit_percent=Decimal("30"),
            deposit_amount=Decimal("54000"),
            paid_amount=Decimal("54000"),
            debt_amount=Decimal("126000"),
            credit_amount=Decimal("0"),
            delivered_at=self.now,
        )
        self.item_a = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=self.product_a,
            quantity=Decimal("10"),
            original_quantity=Decimal("10"),
            unit_price=Decimal("10000"),
            base_unit_price=Decimal("10000"),
            subtotal=Decimal("100000"),
            review_status=PurchaseOrderItemReviewStatus.APPROVED,
        )
        self.item_b = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=self.product_b,
            quantity=Decimal("10"),
            original_quantity=Decimal("10"),
            unit_price=Decimal("8000"),
            base_unit_price=Decimal("8000"),
            subtotal=Decimal("80000"),
            review_status=PurchaseOrderItemReviewStatus.APPROVED,
        )

    def _assert_financial_invariant(self, order):
        """paid - credit + debt == total (cân bằng tiền sau trả hàng)."""
        order.refresh_from_db()
        lhs = order.paid_amount - order.credit_amount + order.debt_amount
        self.assertEqual(
            lhs,
            order.total_amount,
            msg=(
                f"Invariant failed: paid({order.paid_amount}) - credit({order.credit_amount}) "
                f"+ debt({order.debt_amount}) != total({order.total_amount})"
            ),
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
        self.assertEqual(self.order.deposit_amount, Decimal("42000"))
        self.assertEqual(self.order.debt_amount, Decimal("86000"))
        self.assertEqual(self.order.credit_amount, Decimal("0"))
        self._assert_financial_invariant(self.order)

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
        self.assertEqual(self.order.deposit_amount, Decimal("0"))
        self.assertEqual(self.order.credit_amount, Decimal("54000"))
        self._assert_financial_invariant(self.order)

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
        self.assertEqual(self.order.deposit_amount, Decimal("24000"))
        self.assertEqual(self.order.debt_amount, Decimal("26000"))
        self.assertEqual(self.order.credit_amount, Decimal("0"))
        self._assert_financial_invariant(self.order)

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

    def test_rejected_items_do_not_block_full_return(self):
        rejected_item = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=self.product_b,
            quantity=Decimal("5"),
            original_quantity=Decimal("5"),
            unit_price=Decimal("8000"),
            base_unit_price=Decimal("8000"),
            subtotal=Decimal("0"),
            review_status=PurchaseOrderItemReviewStatus.REJECTED,
            rejection_reason="NCC từ chối dòng này",
        )

        po_return = dealer_request_return(
            self.order,
            self.dealer_user,
            reason="Trả hết hàng đã nhận",
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
        rejected_item.refresh_from_db()
        self.assertEqual(self.order.status, PurchaseOrderStatus.RETURNED)
        self.assertEqual(rejected_item.review_status, PurchaseOrderItemReviewStatus.REJECTED)

    def test_rejects_return_for_unapproved_item(self):
        rejected_item = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            supplier_product=self.product_b,
            quantity=Decimal("5"),
            original_quantity=Decimal("5"),
            unit_price=Decimal("8000"),
            base_unit_price=Decimal("8000"),
            subtotal=Decimal("0"),
            review_status=PurchaseOrderItemReviewStatus.REJECTED,
            rejection_reason="NCC từ chối dòng này",
        )

        with self.assertRaises(ValidationError):
            dealer_request_return(
                self.order,
                self.dealer_user,
                reason="Trả dòng bị từ chối",
                items=[
                    {
                        "purchase_order_item_id": rejected_item.id,
                        "quantity": Decimal("1"),
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


class PurchaseOrderReturnFinancialTests(TestCase):
    """Kiểm tra chính xác số tiền khi trả hàng — mọi case phải thỏa invariant."""

    def setUp(self):
        self.now = timezone.now()

        dealer_account = Account.objects.create_user(
            username="dealer_po_return_fin",
            email="dealer_po_return_fin@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store PO Return Fin",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.dealer_user = dealer_account

        supplier_account = Account.objects.create_user(
            username="sup_po_return_fin",
            email="sup_po_return_fin@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC PO Return Fin",
            tax_code="5555555555",
            phone="0900000005",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.supplier_user = supplier_account

        category = Category.objects.create(
            name="Rau PO Return Fin",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Rau củ PO Fin",
            slug="rau-cu-po-return-fin",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )

    def _assert_financial_invariant(self, order):
        order.refresh_from_db()
        lhs = order.paid_amount - order.credit_amount + order.debt_amount
        self.assertEqual(
            lhs,
            order.total_amount,
            msg=(
                f"Invariant failed: paid({order.paid_amount}) - credit({order.credit_amount}) "
                f"+ debt({order.debt_amount}) != total({order.total_amount})"
            ),
        )

    def _create_delivered_order(
        self,
        *,
        quantity,
        unit_price,
        base_unit_price=None,
        deposit_percent=Decimal("30"),
        paid_amount=None,
        total_amount=None,
    ):
        base_unit_price = base_unit_price or unit_price
        subtotal = unit_price * quantity
        total_amount = total_amount or subtotal
        if paid_amount is None:
            paid_amount = (total_amount * deposit_percent / Decimal("100")).quantize(
                Decimal("0.01")
            )
        deposit_amount = (total_amount * deposit_percent / Decimal("100")).quantize(
            Decimal("0.01")
        )
        debt_amount = max(total_amount - paid_amount, Decimal("0"))

        order = PurchaseOrder.objects.create(
            order_code=f"PN-TEST-FIN-{quantity}",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.DELIVERED,
            delivery_address="Addr",
            requested_delivery_time=self.now,
            receiver_name="Test",
            receiver_phone="0900000000",
            total_amount=total_amount,
            deposit_percent=deposit_percent,
            deposit_amount=deposit_amount,
            paid_amount=paid_amount,
            debt_amount=debt_amount,
            credit_amount=Decimal("0"),
            delivered_at=self.now,
        )
        item = PurchaseOrderItem.objects.create(
            purchase_order=order,
            supplier_product=self.product,
            quantity=quantity,
            original_quantity=quantity,
            unit_price=unit_price,
            base_unit_price=base_unit_price,
            subtotal=subtotal,
            review_status=PurchaseOrderItemReviewStatus.APPROVED,
        )
        return order, item

    def _approve_return(self, order, item, return_qty):
        po_return = dealer_request_return(
            order,
            self.dealer_user,
            reason="Trả hàng",
            items=[
                {
                    "purchase_order_item_id": item.id,
                    "quantity": return_qty,
                    "reason": "",
                }
            ],
        )
        supplier_review_return(po_return, self.supplier_user, approved=True)
        return po_return

    def test_100kg_deposit_paid_return_50kg(self):
        """100kg × 10k, cọc 30% đã trả, trả 50kg → còn nợ 200k."""
        order, item = self._create_delivered_order(
            quantity=Decimal("100"),
            unit_price=Decimal("10000"),
        )
        self.assertEqual(order.paid_amount, Decimal("300000"))
        self.assertEqual(order.debt_amount, Decimal("700000"))

        po_return = self._approve_return(order, item, Decimal("50"))
        self.assertEqual(po_return.refund_amount, Decimal("500000.00"))

        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("500000"))
        self.assertEqual(order.deposit_amount, Decimal("150000"))
        self.assertEqual(order.paid_amount, Decimal("300000"))
        self.assertEqual(order.debt_amount, Decimal("200000"))
        self.assertEqual(order.credit_amount, Decimal("0"))
        self._assert_financial_invariant(order)

    def test_full_return_after_deposit_only_creates_credit(self):
        order, item = self._create_delivered_order(
            quantity=Decimal("100"),
            unit_price=Decimal("10000"),
        )

        self._approve_return(order, item, Decimal("100"))

        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("0"))
        self.assertEqual(order.deposit_amount, Decimal("0"))
        self.assertEqual(order.paid_amount, Decimal("300000"))
        self.assertEqual(order.debt_amount, Decimal("0"))
        self.assertEqual(order.credit_amount, Decimal("300000"))
        self._assert_financial_invariant(order)

    def test_full_payment_then_partial_return_creates_credit(self):
        """Đã trả hết 1M, trả 60kg → total 400k, credit 600k."""
        order, item = self._create_delivered_order(
            quantity=Decimal("100"),
            unit_price=Decimal("10000"),
            paid_amount=Decimal("1000000"),
        )
        self.assertEqual(order.debt_amount, Decimal("0"))

        self._approve_return(order, item, Decimal("60"))

        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("400000"))
        self.assertEqual(order.deposit_amount, Decimal("120000"))
        self.assertEqual(order.paid_amount, Decimal("1000000"))
        self.assertEqual(order.debt_amount, Decimal("0"))
        self.assertEqual(order.credit_amount, Decimal("600000"))
        self._assert_financial_invariant(order)

    def test_two_sequential_partial_returns_cumulative_totals(self):
        order, item = self._create_delivered_order(
            quantity=Decimal("100"),
            unit_price=Decimal("10000"),
        )

        self._approve_return(order, item, Decimal("30"))
        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("700000"))
        self.assertEqual(order.debt_amount, Decimal("400000"))
        self._assert_financial_invariant(order)

        self._approve_return(order, item, Decimal("20"))
        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("500000"))
        self.assertEqual(order.deposit_amount, Decimal("150000"))
        self.assertEqual(order.debt_amount, Decimal("200000"))
        self.assertEqual(order.credit_amount, Decimal("0"))
        self._assert_financial_invariant(order)

    def test_return_uses_discounted_unit_price_not_base(self):
        """Hoàn tiền theo unit_price (đã giảm), không phải base_unit_price."""
        order, item = self._create_delivered_order(
            quantity=Decimal("100"),
            unit_price=Decimal("9000"),
            base_unit_price=Decimal("10000"),
            total_amount=Decimal("900000"),
            paid_amount=Decimal("270000"),
        )
        item.discount_type = "percent"
        item.discount_value = Decimal("10")
        item.discount_min_quantity = Decimal("50")
        item.line_discount_amount = Decimal("100000")
        item.save()

        po_return = self._approve_return(order, item, Decimal("50"))
        self.assertEqual(po_return.refund_amount, Decimal("450000.00"))

        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("450000"))
        self.assertEqual(order.deposit_amount, Decimal("135000"))
        self.assertEqual(order.debt_amount, Decimal("180000"))
        self.assertEqual(order.credit_amount, Decimal("0"))
        self._assert_financial_invariant(order)

    def test_return_more_than_remaining_debt_still_correct(self):
        """Trả nhiều tiền hơn nợ còn lại — credit = paid - new_total."""
        order, item = self._create_delivered_order(
            quantity=Decimal("100"),
            unit_price=Decimal("10000"),
            paid_amount=Decimal("500000"),
        )
        self.assertEqual(order.debt_amount, Decimal("500000"))

        self._approve_return(order, item, Decimal("80"))

        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("200000"))
        self.assertEqual(order.deposit_amount, Decimal("60000"))
        self.assertEqual(order.debt_amount, Decimal("0"))
        self.assertEqual(order.credit_amount, Decimal("300000"))
        self._assert_financial_invariant(order)

    def test_zero_deposit_percent_return_recalculates_deposit_zero(self):
        order, item = self._create_delivered_order(
            quantity=Decimal("50"),
            unit_price=Decimal("20000"),
            deposit_percent=Decimal("0"),
            paid_amount=Decimal("0"),
        )

        self._approve_return(order, item, Decimal("20"))

        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal("600000"))
        self.assertEqual(order.deposit_amount, Decimal("0"))
        self.assertEqual(order.debt_amount, Decimal("600000"))
        self.assertEqual(order.credit_amount, Decimal("0"))
        self._assert_financial_invariant(order)
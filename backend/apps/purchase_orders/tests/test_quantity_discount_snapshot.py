"""Tests snapshot giảm giá theo SL trên dòng phiếu nhập."""

from datetime import timedelta

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import PurchaseOrderItem
from apps.purchase_orders.services import build_order_items, create_purchase_order
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.supplier_products.models_quantity_discount import (
    QuantityDiscountPolicy,
    QuantityDiscountScope,
    QuantityDiscountTier,
    QuantityDiscountType,
)
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class PurchaseOrderQuantityDiscountSnapshotTests(TestCase):
    def setUp(self):
        supplier_account = Account.objects.create_user(
            username="supplier_po_qty",
            email="supplier_po_qty@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        dealer_account = Account.objects.create_user(
            username="dealer_po_qty",
            email="dealer_po_qty@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC PO Qty",
            tax_code="0123456780",
            phone="0900000002",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="DL PO Qty",
            store_address="HN",
            status=DealerProfileStatus.ACTIVE,
        )
        self.category = Category.objects.create(
            name="Rau PO",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Xà lách PO",
            slug="xa-lach-po",
            unit="kg",
            wholesale_price=Decimal("100000.00"),
            status=SupplierProductStatus.ACTIVE,
        )
        policy = QuantityDiscountPolicy.objects.create(
            supplier=self.supplier,
            title="Giảm 100kg",
            scope=QuantityDiscountScope.ALL,
            is_active=True,
        )
        QuantityDiscountTier.objects.create(
            policy=policy,
            min_quantity=Decimal("100"),
            discount_type=QuantityDiscountType.PERCENT,
            discount_value=Decimal("10"),
            sort_order=0,
        )

    def test_build_order_items_snapshots_discount(self):
        from apps.purchase_orders.models import PurchaseOrder

        order = PurchaseOrder.objects.create(
            order_code="PO-TEST-001",
            supplier=self.supplier,
            dealer=self.dealer,
            delivery_address="HN",
            requested_delivery_time=timezone.now() + timedelta(days=10),
            receiver_name="A",
            receiver_phone="090",
        )
        items_data = [
            {
                "supplier_product": self.product,
                "quantity": Decimal("150"),
                "note": "",
            }
        ]
        build_order_items(order, items_data)
        item = PurchaseOrderItem.objects.get(purchase_order=order)
        self.assertEqual(item.base_unit_price, Decimal("100000.00"))
        self.assertEqual(item.unit_price, Decimal("90000.00"))
        self.assertEqual(item.discount_type, "percent")
        self.assertEqual(item.discount_value, Decimal("10"))
        self.assertEqual(item.discount_min_quantity, Decimal("100"))
        self.assertEqual(item.line_discount_amount, Decimal("1500000.00"))
        self.assertEqual(item.subtotal, Decimal("13500000.00"))

    def test_create_order_without_discount(self):
        order = create_purchase_order(
            dealer_profile=self.dealer,
            supplier=self.supplier,
            delivery_data={
                "delivery_address": "HN",
                "requested_delivery_time": timezone.now() + timedelta(days=10),
                "receiver_name": "A",
                "receiver_phone": "090",
                "note": "",
            },
            items_data=[
                {
                    "supplier_product": self.product,
                    "quantity": Decimal("50"),
                    "note": "",
                }
            ],
            user=self.dealer.account,
        )
        item = order.items.get()
        self.assertEqual(item.base_unit_price, Decimal("100000.00"))
        self.assertEqual(item.unit_price, Decimal("100000.00"))
        self.assertEqual(item.line_discount_amount, Decimal("0"))
        self.assertEqual(item.discount_type, "")

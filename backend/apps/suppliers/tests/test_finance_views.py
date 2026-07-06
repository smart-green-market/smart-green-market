from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import (
    PurchaseOrder,
    PurchaseOrderPayment,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
    PurchaseOrderReturn,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class SupplierFinanceApiTests(APITestCase):
    def setUp(self):
        self.admin = Account.objects.create_user(
            username="admin_finance",
            email="admin_finance@test.com",
            password="pass",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
            is_staff=True,
        )
        dealer_account = Account.objects.create_user(
            username="dealer_finance",
            email="dealer_finance@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Dealer Finance",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_finance",
            email="supplier_finance@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Finance Alpha",
            tax_code="9000000001",
            phone="0901000001",
            address="HCM",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        category = Category.objects.create(
            name="Rau Finance",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        self.product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=category,
            name="Rau finance",
            slug="rau-finance",
            unit="kg",
            wholesale_price="10000.00",
            status=SupplierProductStatus.ACTIVE,
        )
        now = timezone.now()
        self.order = PurchaseOrder.objects.create(
            order_code="PN-FIN-001",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=now,
            receiver_name="Test",
            receiver_phone="0900000000",
            total_amount=Decimal("1000000.00"),
            deposit_percent=Decimal("30"),
            deposit_amount=Decimal("300000.00"),
            paid_amount=Decimal("1000000.00"),
            debt_amount=Decimal("0"),
            credit_amount=Decimal("0"),
            delivered_at=now,
        )
        PurchaseOrderPayment.objects.create(
            purchase_order=self.order,
            payment_method="bank_transfer",
            amount=Decimal("300000.00"),
            payment_type=PurchaseOrderPaymentType.DEPOSIT,
            status=PurchaseOrderPaymentStatus.VERIFIED,
            verified_at=now,
            paid_at=now,
        )
        PurchaseOrderPayment.objects.create(
            purchase_order=self.order,
            payment_method="bank_transfer",
            amount=Decimal("700000.00"),
            payment_type=PurchaseOrderPaymentType.FINAL_PAYMENT,
            status=PurchaseOrderPaymentStatus.VERIFIED,
            verified_at=now,
            paid_at=now,
        )
        PurchaseOrderReturn.objects.create(
            purchase_order=self.order,
            status=PurchaseOrderReturnStatus.APPROVED,
            reason="Hàng lỗi",
            refund_amount=Decimal("100000.00"),
            resolved_at=now,
        )
        self.overview_url = reverse("supplier-finance-overview")
        self.list_url = reverse("supplier-finance")

    def test_finance_overview_requires_admin(self):
        self.client.force_authenticate(user=self.supplier.account)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_finance_overview_returns_aggregates(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["supplier_count"], 1)
        self.assertEqual(Decimal(response.data["total_system_revenue"]), Decimal("1000000.00"))
        self.assertEqual(Decimal(response.data["total_cash_in"]), Decimal("1000000.00"))
        self.assertEqual(Decimal(response.data["total_cash_out"]), Decimal("100000.00"))

    def test_finance_list_returns_supplier_row(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.list_url, {"page_size": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        row = response.data["results"][0]
        self.assertEqual(row["company_name"], "NCC Finance Alpha")
        self.assertEqual(Decimal(row["total_revenue"]), Decimal("1000000.00"))
        self.assertEqual(row["order_count"], 1)
        self.assertTrue(isinstance(row["cash_flow"], list))
        self.assertGreaterEqual(len(row["cash_flow"]), 1)

    def test_finance_list_search_by_tax_code(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.list_url, {"search": "9000000001"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

        empty = self.client.get(self.list_url, {"search": "not-found"})
        self.assertEqual(empty.data["count"], 0)

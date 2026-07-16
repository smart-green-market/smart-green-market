"""Tests API supplier — danh sách đại lý đã mua hàng."""

from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class SupplierPurchasingDealersApiTests(APITestCase):
    def setUp(self):
        self.admin = Account.objects.create_user(
            username="admin_sup_dealers",
            email="admin_sup_dealers@test.com",
            password="pass",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
            is_staff=True,
        )
        dealer_account = Account.objects.create_user(
            username="dealer_sup_list",
            email="dealer_sup_list@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
            full_name="Dealer Owner",
            phone="0901111222",
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Green Shop",
            store_address="123 HN",
            status=DealerProfileStatus.ACTIVE,
        )
        cancelled_dealer_account = Account.objects.create_user(
            username="dealer_cancel_only",
            email="dealer_cancel_only@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.cancelled_only_dealer = DealerProfile.objects.create(
            account=cancelled_dealer_account,
            store_name="Cancelled Only",
            store_address="456 HN",
            status=DealerProfileStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_dealers",
            email="supplier_dealers@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Dealers Test",
            tax_code="9000000099",
            phone="0901000099",
            address="HCM",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        other_supplier_account = Account.objects.create_user(
            username="supplier_other",
            email="supplier_other@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.other_supplier = Supplier.objects.create(
            account=other_supplier_account,
            company_name="NCC Other",
            tax_code="9000000100",
            phone="0901000100",
            address="DN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        now = timezone.now()
        self.completed_order = PurchaseOrder.objects.create(
            order_code="PN-DEALERS-001",
            supplier=self.supplier,
            dealer=self.dealer,
            status=PurchaseOrderStatus.COMPLETED,
            delivery_address="Addr",
            requested_delivery_time=now,
            receiver_name="Test",
            receiver_phone="0900000000",
            total_amount=Decimal("500000.00"),
        )
        PurchaseOrder.objects.create(
            order_code="PN-DEALERS-CANCEL",
            supplier=self.supplier,
            dealer=self.cancelled_only_dealer,
            status=PurchaseOrderStatus.CANCELLED,
            delivery_address="Addr",
            requested_delivery_time=now,
            receiver_name="Test",
            receiver_phone="0900000001",
            total_amount=Decimal("100000.00"),
        )
        self.url = f"/api/suppliers/{self.supplier.id}/dealers/"

    def test_supplier_lists_purchasing_dealers(self):
        self.client.force_authenticate(user=self.supplier.account)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        row = results[0]
        self.assertEqual(row["id"], self.dealer.id)
        self.assertEqual(row["store_name"], "Green Shop")
        self.assertEqual(row["order_count"], 1)
        self.assertEqual(row["completed_order_count"], 1)
        self.assertEqual(row["total_purchase_amount"], "500000.00")
        self.assertEqual(row["contact"]["full_name"], "Dealer Owner")
        self.assertEqual(row["contact"]["phone"], "0901111222")

    def test_cancelled_only_dealer_excluded(self):
        self.client.force_authenticate(user=self.supplier.account)
        response = self.client.get(self.url)

        results = response.data.get("results", response.data)
        dealer_ids = {row["id"] for row in results}
        self.assertNotIn(self.cancelled_only_dealer.id, dealer_ids)

    def test_admin_can_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", response.data)), 1)

    def test_dealer_forbidden(self):
        self.client.force_authenticate(user=self.dealer.account)
        response = self.client.get(self.url)
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

    def test_other_supplier_cannot_view(self):
        self.client.force_authenticate(user=self.other_supplier.account)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_by_store_name(self):
        self.client.force_authenticate(user=self.supplier.account)
        response = self.client.get(self.url, {"search": "Green Shop"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", response.data)), 1)

        response = self.client.get(self.url, {"search": "Not Found"})
        self.assertEqual(len(response.data.get("results", response.data)), 0)

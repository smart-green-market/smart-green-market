from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import AccountRole, AccountStatus
from apps.customers.models import CustomerProfile
from apps.dealers.models import DealerProfile, DealerProfileStatus

Account = get_user_model()


class AdminCustomerApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Account.objects.create_user(
            username="admin-customers",
            email="admin-customers@test.com",
            password="pass12345",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        dealer_a_account = Account.objects.create_user(
            username="dealer-a-customers",
            email="dealer-a-customers@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        dealer_b_account = Account.objects.create_user(
            username="dealer-b-customers",
            email="dealer-b-customers@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer_a = DealerProfile.objects.create(
            account=dealer_a_account,
            store_name="Store Alpha",
            store_address="123 Alpha",
            status=DealerProfileStatus.ACTIVE,
            verified_by=self.admin,
        )
        self.dealer_b = DealerProfile.objects.create(
            account=dealer_b_account,
            store_name="Store Beta",
            store_address="456 Beta",
            status=DealerProfileStatus.ACTIVE,
            verified_by=self.admin,
        )
        buyer_a = Account.objects.create_user(
            username="buyer-a",
            email="buyer-a@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer_a,
            full_name="Buyer Alpha",
        )
        buyer_b = Account.objects.create_user(
            username="buyer-b",
            email="buyer-b@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer_b,
            full_name="Buyer Beta",
        )
        self.profile_a = CustomerProfile.objects.create(
            user=buyer_a,
            total_orders=2,
            total_spent=Decimal("200000"),
            note="Note A",
        )
        self.profile_b = CustomerProfile.objects.create(
            user=buyer_b,
            total_orders=1,
            total_spent=Decimal("100000"),
            note="Note B",
        )
        self.dealer_a_account = dealer_a_account

    def test_admin_lists_all_customers(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/customers/")
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        emails = {item["email"] for item in results}
        self.assertEqual(emails, {"buyer-a@test.com", "buyer-b@test.com"})
        self.assertIn("count_status", response.data)

    def test_admin_filters_by_dealer_id(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            "/api/admin/customers/",
            {"dealer_id": self.dealer_a.id},
        )
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "buyer-a@test.com")
        self.assertEqual(results[0]["dealer_name"], "Store Alpha")

    def test_admin_filters_by_dealer_slug(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            "/api/admin/customers/",
            {"dealer_slug": self.dealer_b.slug},
        )
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "buyer-b@test.com")

    def test_admin_retrieve_and_update_note(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/admin/customers/{self.profile_a.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["note"], "Note A")
        self.assertEqual(response.data["dealer_slug"], self.dealer_a.slug)

        response = self.client.patch(
            f"/api/admin/customers/{self.profile_a.id}/",
            {"note": "Admin updated note"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["note"], "Admin updated note")

    def test_dealer_cannot_access_admin_customers(self):
        self.client.force_authenticate(user=self.dealer_a_account)
        response = self.client.get("/api/admin/customers/")
        self.assertEqual(response.status_code, 403)

    def test_admin_search_customers(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/customers/", {"search": "Buyer Beta"})
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "buyer-b@test.com")

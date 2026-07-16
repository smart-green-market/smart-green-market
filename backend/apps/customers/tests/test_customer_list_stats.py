"""Tests thống kê loyalty/segment trên API danh sách khách hàng."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import AccountRole, AccountStatus
from apps.customers.models import CustomerProfile
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.loyalty.models import LoyaltyTier
from apps.loyalty.tier_defaults import seed_default_loyalty_for_dealer
from apps.marketing.models import CustomerSegment, CustomerSegmentMember
from apps.marketing.segment_defaults import seed_system_customer_segments

Account = get_user_model()


class CustomerListStatsTests(TestCase):
    def setUp(self):
        seed_system_customer_segments()
        self.client = APIClient()
        self.admin = Account.objects.create_user(
            username="admin-list-stats",
            email="admin-list-stats@test.com",
            password="pass12345",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        dealer_account = Account.objects.create_user(
            username="dealer-list-stats",
            email="dealer-list-stats@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Stats",
            store_address="123 Stats",
            status=DealerProfileStatus.ACTIVE,
            verified_by=self.admin,
        )
        seed_default_loyalty_for_dealer(self.dealer)
        self.member_tier = LoyaltyTier.objects.get(dealer=self.dealer, code="MEMBER")
        self.silver_tier = LoyaltyTier.objects.get(dealer=self.dealer, code="SILVER")
        self.vip_segment = CustomerSegment.objects.get(code="VIP")
        self.passive_segment = CustomerSegment.objects.get(code="PASSIVE")

        buyer_vip = Account.objects.create_user(
            username="buyer-vip-stats",
            email="buyer-vip-stats@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer,
            full_name="Buyer VIP",
        )
        buyer_passive = Account.objects.create_user(
            username="buyer-passive-stats",
            email="buyer-passive-stats@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer,
            full_name="Buyer Passive",
        )
        self.profile_vip = CustomerProfile.objects.create(
            user=buyer_vip,
            total_orders=3,
            total_spent=Decimal("300000"),
        )
        self.profile_vip.current_tier = self.silver_tier
        self.profile_vip.save(update_fields=["current_tier", "updated_at"])
        self.profile_passive = CustomerProfile.objects.create(
            user=buyer_passive,
            total_orders=1,
            total_spent=Decimal("50000"),
        )
        CustomerSegmentMember.objects.create(
            customer_profile=self.profile_vip,
            segment=self.vip_segment,
        )
        # profile_passive đã được gán PASSIVE qua signal khi tạo CustomerProfile

    def test_admin_list_includes_loyalty_and_segment_stats(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/customers/", {"dealer_id": self.dealer.id})
        self.assertEqual(response.status_code, 200)
        self.assertIn("count_loyalty", response.data)
        self.assertIn("count_segment", response.data)
        self.assertEqual(response.data["count_loyalty"]["SILVER"], 1)
        self.assertEqual(response.data["count_loyalty"]["MEMBER"], 1)
        self.assertEqual(response.data["count_segment"]["VIP"], 1)
        self.assertEqual(response.data["count_segment"]["PASSIVE"], 1)

    def test_admin_filter_by_segment_code_uses_primary_segment(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            "/api/admin/customers/",
            {"dealer_id": self.dealer.id, "segment_code": "VIP"},
        )
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "buyer-vip-stats@test.com")

    def test_dealer_list_includes_loyalty_and_segment_stats(self):
        self.client.force_authenticate(user=self.dealer.account)
        response = self.client.get("/api/dealer-customers/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("count_loyalty", response.data)
        self.assertIn("count_segment", response.data)
        self.assertEqual(response.data["count_segment"]["VIP"], 1)

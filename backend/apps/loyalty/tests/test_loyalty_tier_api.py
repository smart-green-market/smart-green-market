from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import AccountRole, AccountStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.loyalty.models import LoyaltyTier
from apps.loyalty.tier_defaults import seed_default_loyalty_for_dealer

Account = get_user_model()


class LoyaltyTierUpdateApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Account.objects.create_user(
            username="admin-tier-update",
            email="admin-tier-update@test.com",
            password="pass12345",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        dealer_account = Account.objects.create_user(
            username="dealer-tier-update",
            email="dealer-tier-update@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Tier Update Store",
            store_address="123",
            status=DealerProfileStatus.ACTIVE,
            verified_by=self.admin,
        )
        seed_default_loyalty_for_dealer(self.dealer)
        self.tier = LoyaltyTier.objects.get(dealer=self.dealer, code="MEMBER")
        self.other_tier = LoyaltyTier.objects.get(dealer=self.dealer, code="SILVER")
        self.dealer_account = dealer_account

    def _payload(self, **overrides):
        data = {
            "code": "1",
            "name": "1",
            "level": 5,
            "min_points": 5,
            "description": "1",
            "benefits": "1",
            "is_active": True,
        }
        data.update(overrides)
        return data

    def test_dealer_put_returns_400_for_duplicate_level_not_500(self):
        self.client.force_authenticate(user=self.dealer_account)
        response = self.client.put(
            f"/api/loyalty-tiers/{self.tier.id}/",
            self._payload(level=self.other_tier.level),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("level", response.data.get("errors", response.data))

    def test_admin_put_validates_dealer_uniqueness(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f"/api/loyalty-tiers/{self.tier.id}/",
            self._payload(level=self.other_tier.level),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("level", response.data.get("errors", response.data))

    def test_dealer_put_coerces_benefits_string(self):
        self.client.force_authenticate(user=self.dealer_account)
        response = self.client.put(
            f"/api/loyalty-tiers/{self.tier.id}/",
            self._payload(level=10, benefits="Free shipping"),
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.tier.refresh_from_db()
        self.assertEqual(self.tier.benefits, ["Free shipping"])

    def test_dealer_put_success_with_list_benefits(self):
        self.client.force_authenticate(user=self.dealer_account)
        response = self.client.put(
            f"/api/loyalty-tiers/{self.tier.id}/",
            self._payload(level=10, benefits=["Voucher 5%"]),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["benefits"], ["Voucher 5%"])

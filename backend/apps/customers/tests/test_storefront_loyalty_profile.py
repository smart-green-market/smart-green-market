"""Tests storefront profile hides internal segments."""

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.customers.models import CustomerProfile
from apps.customers.serializers import StorefrontCustomerProfileSerializer
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.loyalty.tier_defaults import seed_default_loyalty_for_dealer
from apps.marketing.models import CustomerSegment, CustomerSegmentMember


class StorefrontProfileLoyaltyTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_profile",
            email="dealer_profile@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store A",
            status=DealerProfileStatus.ACTIVE,
        )
        seed_default_loyalty_for_dealer(self.dealer)

        buyer = Account.objects.create_user(
            username="buyer_profile",
            email="buyer_profile@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer,
        )
        self.profile = CustomerProfile.objects.create(user=buyer)
        segment = CustomerSegment.objects.create(code="VIP_TEST", name="VIP Test")
        CustomerSegmentMember.objects.create(
            customer_profile=self.profile,
            segment=segment,
        )

    def test_storefront_profile_hides_segments_and_exposes_loyalty(self):
        request = APIRequestFactory().get("/")
        data = StorefrontCustomerProfileSerializer(
            self.profile,
            context={"request": request},
        ).data
        self.assertNotIn("segments", data)
        self.assertNotIn("primary_segment", data)
        self.assertIn("loyalty", data)
        self.assertEqual(data["loyalty"]["current_tier"]["code"], "MEMBER")

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import AccountRole, AccountStatus
from apps.customers.models import CustomerProfile
from apps.customers.serializers import CustomerProfileSerializer
from apps.customers.services import customer_profile_detail_queryset
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.marketing.models import CustomerSegment, CustomerSegmentMember
from apps.marketing.segment_defaults import seed_system_customer_segments

Account = get_user_model()


class CustomerProfileSegmentSerializerTests(TestCase):
    def setUp(self):
        seed_system_customer_segments()
        self.passive = CustomerSegment.objects.get(code="PASSIVE")
        self.vip = CustomerSegment.objects.get(code="VIP")

        admin = Account.objects.create_user(
            username="admin-segment-me",
            email="admin-segment-me@test.com",
            password="pass12345",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        dealer_account = Account.objects.create_user(
            username="dealer-segment-me",
            email="dealer-segment-me@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Store Segment Me",
            store_address="123 Test",
            status=DealerProfileStatus.ACTIVE,
            verified_by=admin,
        )
        buyer_account = Account.objects.create_user(
            username="buyer-segment-me",
            email="buyer-segment-me@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer,
        )
        self.profile = CustomerProfile.objects.create(
            user=buyer_account,
            total_orders=1,
            total_spent=Decimal("100000"),
        )
        CustomerSegmentMember.objects.filter(customer_profile=self.profile).delete()
        CustomerSegmentMember.objects.create(
            customer_profile=self.profile,
            segment=self.passive,
        )
        CustomerSegmentMember.objects.create(
            customer_profile=self.profile,
            segment=self.vip,
        )

    def test_profile_serializer_includes_segments(self):
        profile = customer_profile_detail_queryset().get(pk=self.profile.pk)
        data = CustomerProfileSerializer(profile).data

        self.assertEqual(len(data["segments"]), 2)
        codes = {item["code"] for item in data["segments"]}
        self.assertEqual(codes, {"PASSIVE", "VIP"})
        self.assertIn("joined_at", data["segments"][0])

    def test_profile_serializer_primary_segment_prefers_vip(self):
        profile = customer_profile_detail_queryset().get(pk=self.profile.pk)
        data = CustomerProfileSerializer(profile).data

        self.assertEqual(data["primary_segment"]["code"], "VIP")
        self.assertEqual(data["primary_segment"]["id"], self.vip.id)

    def test_dealer_customer_list_serializer_includes_segments(self):
        from apps.customers.storefront_serializers import DealerCustomerListSerializer
        profile = customer_profile_detail_queryset().get(pk=self.profile.pk)
        data = DealerCustomerListSerializer(profile).data

        self.assertEqual(len(data["segments"]), 2)
        codes = {item["code"] for item in data["segments"]}
        self.assertEqual(codes, {"PASSIVE", "VIP"})
        self.assertEqual(data["primary_segment"]["code"], "VIP")

    def test_dealer_customer_api_returns_segments(self):
        from rest_framework.test import APIClient
        client = APIClient()

        # Authenticate as dealer
        user = Account.objects.get(username="dealer-segment-me")
        client.force_authenticate(user=user)

        # Test List API
        response = client.get("/api/dealer-customers/")
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(len(results[0]["segments"]), 2)
        self.assertEqual(results[0]["primary_segment"]["code"], "VIP")

        # Test Retrieve API
        response = client.get(f"/api/dealer-customers/{self.profile.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["segments"]), 2)
        self.assertEqual(response.data["primary_segment"]["code"], "VIP")

        # Test Partial Update API (PATCH)
        response = client.patch(
            f"/api/dealer-customers/{self.profile.id}/",
            {"note": "Updated note"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        # Verify it returns the full object with segments
        self.assertEqual(response.data["note"], "Updated note")
        self.assertEqual(len(response.data["segments"]), 2)
        self.assertEqual(response.data["primary_segment"]["code"], "VIP")

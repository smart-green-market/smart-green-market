from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Account, AccountRole
from apps.dealers.models import DealerProfile
from apps.marketing.models import CustomerSegment


class CustomerSegmentViewSetTests(APITestCase):
    def setUp(self):
        # Create users & dealers
        self.dealer_user = Account.objects.create_user(
            username="dealer_test",
            email="dealer@test.com",
            password="testpassword",
            role=AccountRole.DEALER,
            full_name="Dealer Test User",
        )
        self.dealer_profile = DealerProfile.objects.create(
            account=self.dealer_user,
            store_name="Dealer Store Test",
            slug="dealer-store-test",
        )

        self.other_dealer_user = Account.objects.create_user(
            username="other_dealer_test",
            email="other_dealer@test.com",
            password="testpassword",
            role=AccountRole.DEALER,
            full_name="Other Dealer User",
        )
        self.other_dealer_profile = DealerProfile.objects.create(
            account=self.other_dealer_user,
            store_name="Other Store Test",
            slug="other-store-test",
        )

        # Create segments
        self.segment1 = CustomerSegment.objects.create(
            dealer=self.dealer_profile,
            code="vip",
            name="Khách hàng VIP",
            description="Mô tả VIP",
        )
        self.segment2 = CustomerSegment.objects.create(
            dealer=self.other_dealer_profile,
            code="vip_other",
            name="VIP Other Dealer",
            description="Other VIP",
        )

        self.list_url = reverse("customer-segment-list")

    def test_list_segments_unauthenticated(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_segments_dealer_filters_own(self):
        self.client.force_authenticate(user=self.dealer_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only see segment1, not segment2
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.segment1.id)
        self.assertEqual(results[0]["code"], "vip")
        self.assertEqual(results[0]["name"], "Khách hàng VIP")

    def test_create_segment_for_logged_in_dealer(self):
        self.client.force_authenticate(user=self.dealer_user)
        payload = {
            "code": "new_segment",
            "name": "Nhóm mới",
            "description": "Mô tả nhóm mới",
        }
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["code"], "new_segment")

        # Verify in DB
        segment = CustomerSegment.objects.get(code="new_segment")
        self.assertEqual(segment.dealer, self.dealer_profile)

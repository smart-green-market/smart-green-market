from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Account, AccountRole
from apps.dealers.models import DealerProfile
from apps.marketing.models import CustomerSegment


class CustomerSegmentViewSetTests(APITestCase):
    def setUp(self):
        self.dealer_user = Account.objects.create_user(
            username="dealer_test",
            email="dealer@test.com",
            password="testpassword",
            role=AccountRole.DEALER,
            full_name="Dealer Test User",
        )
        DealerProfile.objects.create(
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
        DealerProfile.objects.create(
            account=self.other_dealer_user,
            store_name="Other Store Test",
            slug="other-store-test",
        )

        self.segment1 = CustomerSegment.objects.create(
            code="test_vip",
            name="Khách hàng VIP",
            description="Mô tả VIP",
        )
        self.segment2 = CustomerSegment.objects.create(
            code="test_vip_other",
            name="VIP Other Dealer",
            description="Other VIP",
        )

        self.list_url = reverse("customer-segment-list")

    def test_list_segments_unauthenticated(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_segments_dealer_sees_all(self):
        self.client.force_authenticate(user=self.dealer_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", response.data)
        result_ids = {row["id"] for row in results}
        self.assertIn(self.segment1.id, result_ids)
        self.assertIn(self.segment2.id, result_ids)

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

        segment = CustomerSegment.objects.get(code="new_segment")
        self.assertFalse(segment.is_system)

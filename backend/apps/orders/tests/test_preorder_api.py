"""HTTP API tests for storefront/dealer pre-order and delivery reschedule."""

from rest_framework.test import APIClient

from apps.orders.models import OrderStatus, PreOrderRequestStatus
from apps.orders.tests.test_preorder_flow import PreOrderFlowTestBase


class PreOrderApiTests(PreOrderFlowTestBase):
    def setUp(self):
        super().setUp()
        self.buyer_user.store_dealer = self.dealer
        self.buyer_user.save(update_fields=["store_dealer_id"])

        self.buyer_client = APIClient()
        self.buyer_client.force_authenticate(user=self.buyer_user)
        self.dealer_client = APIClient()
        self.dealer_client.force_authenticate(user=self.dealer_user)

    def _check_stock_url(self):
        return f"/api/storefronts/{self.dealer.slug}/check-stock/"

    def _preorder_url(self):
        return f"/api/storefronts/{self.dealer.slug}/preorder-requests/"

    def _preorder_payload(self, *, quantity=20):
        return {
            "items": [{"dealer_product_id": self.dealer_product.id, "quantity": quantity}],
            "customer_address_id": self.address.id,
            "delivery_date": "2026-06-22",
            "delivery_slot": "morning",
            "note": "API test",
        }

    def test_check_stock_api_returns_shortfall(self):
        response = self.buyer_client.post(
            self._check_stock_url(),
            {
                "items": [
                    {"dealer_product_id": self.dealer_product.id, "quantity": 20},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        row = response.data[0]
        self.assertEqual(row["available_quantity"], 10)
        self.assertEqual(row["shortfall"], 10)
        self.assertTrue(row["needs_preorder"])

    def test_create_preorder_request_api(self):
        response = self.buyer_client.post(
            self._preorder_url(),
            self._preorder_payload(),
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], PreOrderRequestStatus.SUBMITTED)
        self.assertTrue(response.data["request_code"])

    def test_dealer_confirm_and_customer_accept_via_api(self):
        create_resp = self.buyer_client.post(
            self._preorder_url(),
            self._preorder_payload(),
            format="json",
        )
        preorder_id = create_resp.data["id"]

        confirm_resp = self.dealer_client.post(
            f"/api/preorder-requests/{preorder_id}/confirm/",
            {"note": "OK"},
            format="json",
        )
        self.assertEqual(confirm_resp.status_code, 200)
        self.assertEqual(
            confirm_resp.data["status"],
            PreOrderRequestStatus.CUSTOMER_CONFIRMATION_PENDING,
        )

        accept_resp = self.buyer_client.post(
            f"/api/storefronts/{self.dealer.slug}/preorder-requests/{preorder_id}/accept/",
            format="json",
        )
        self.assertEqual(accept_resp.status_code, 200)
        self.assertEqual(accept_resp.data["status"], OrderStatus.WAITING_STOCK)

    def test_customer_reject_reschedule_via_api(self):
        order = self._create_waiting_order()

        propose_resp = self.dealer_client.post(
            f"/api/customer-orders/{order.id}/propose-delivery-reschedule/",
            {
                "proposed_delivery_date": "2026-06-22",
                "proposed_delivery_slot": "afternoon",
                "reason": "Hàng về trễ",
            },
            format="json",
        )
        self.assertEqual(propose_resp.status_code, 200, propose_resp.data)
        self.assertEqual(
            propose_resp.data["status"],
            OrderStatus.DELIVERY_RESCHEDULE_PROPOSED,
        )

        reject_resp = self.buyer_client.post(
            f"/api/storefronts/{self.dealer.slug}/orders/{order.id}/reject-delivery-reschedule/",
            {"reason": "Không phù hợp"},
            format="json",
        )
        self.assertEqual(reject_resp.status_code, 200)
        self.assertEqual(reject_resp.data["status"], OrderStatus.CANCELLED)

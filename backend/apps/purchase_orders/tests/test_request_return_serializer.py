"""Tests serializer yêu cầu trả hàng PO (partial) và Order (full)."""

from decimal import Decimal

from django.test import SimpleTestCase

from apps.orders.serializers import RequestOrderReturnSerializer
from apps.purchase_orders.serializers import RequestPurchaseOrderReturnSerializer


class RequestOrderReturnSerializerTests(SimpleTestCase):
    def test_accepts_reason_only(self):
        serializer = RequestOrderReturnSerializer(data={"reason": "Hàng không đạt"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_requires_reason(self):
        serializer = RequestOrderReturnSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("reason", serializer.errors)


class RequestPurchaseOrderReturnSerializerTests(SimpleTestCase):
    def test_accepts_reason_and_items(self):
        serializer = RequestPurchaseOrderReturnSerializer(
            data={
                "reason": "Hàng không đạt",
                "items": [
                    {
                        "purchase_order_item_id": 1,
                        "quantity": "2.50",
                        "reason": "Hỏng",
                    }
                ],
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data["items"][0]["quantity"],
            Decimal("2.50"),
        )

    def test_requires_reason_and_items(self):
        serializer = RequestPurchaseOrderReturnSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("reason", serializer.errors)
        self.assertIn("items", serializer.errors)

    def test_rejects_duplicate_item_ids(self):
        serializer = RequestPurchaseOrderReturnSerializer(
            data={
                "reason": "Hàng không đạt",
                "items": [
                    {"purchase_order_item_id": 1, "quantity": "1"},
                    {"purchase_order_item_id": 1, "quantity": "2"},
                ],
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("items", serializer.errors)

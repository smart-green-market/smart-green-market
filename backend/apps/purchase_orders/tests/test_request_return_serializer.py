"""Tests full-order return request serializer (no items in body)."""

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
    def test_accepts_reason_only(self):
        serializer = RequestPurchaseOrderReturnSerializer(
            data={"reason": "Hàng không đạt"}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

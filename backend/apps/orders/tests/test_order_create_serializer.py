"""Tests validation delivery trên OrderCreateSerializer."""

from datetime import datetime
from unittest.mock import patch

from django.test import SimpleTestCase
from django.utils import timezone

from apps.orders.delivery_slots import VN_TZ
from apps.orders.serializers import OrderCreateSerializer

VN = VN_TZ
FIXED_NOW = datetime(2026, 6, 21, 8, 0, tzinfo=VN)


def _base_payload(**overrides):
    payload = {
        "items": [{"dealer_product_id": 1, "quantity": 1}],
        "customer_address_id": 1,
        "delivery_date": "2026-06-22",
        "delivery_slot": "morning",
    }
    payload.update(overrides)
    return payload


class OrderCreateDeliveryValidationTests(SimpleTestCase):
    def test_requires_delivery_date_and_slot(self):
        serializer = OrderCreateSerializer(data=_base_payload())
        serializer.fields  # ensure import
        for key in ("delivery_date", "delivery_slot"):
            partial = _base_payload()
            partial.pop(key)
            s = OrderCreateSerializer(data=partial)
            self.assertFalse(s.is_valid(), key)

    @patch.object(timezone, "now", return_value=FIXED_NOW)
    def test_date_and_slot_resolved(self, _mock_now):
        serializer = OrderCreateSerializer(data=_base_payload())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data["delivery_time"].astimezone(VN),
            datetime(2026, 6, 22, 7, 0, tzinfo=VN),
        )

    @patch.object(timezone, "now", return_value=FIXED_NOW)
    def test_invalid_slot_rejected(self, _mock_now):
        serializer = OrderCreateSerializer(
            data=_base_payload(delivery_slot="invalid"),
        )
        self.assertFalse(serializer.is_valid())

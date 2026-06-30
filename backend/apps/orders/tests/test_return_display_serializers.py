"""Tests return/cancel display fields on order serializers."""

from decimal import Decimal
from unittest.mock import MagicMock

from django.test import SimpleTestCase

from apps.orders.models import OrderReturnStatus, OrderStatus
from apps.orders.serializers import OrderDetailSerializer, OrderListSerializer
from common.return_summary import build_return_summary


class BuildReturnSummaryTests(SimpleTestCase):
    def test_pending_and_approved_totals(self):
        pending = MagicMock(
            id=10,
            status=OrderReturnStatus.REQUESTED,
            refund_amount=Decimal("100"),
            created_at=1,
        )
        approved = MagicMock(
            id=11,
            status=OrderReturnStatus.APPROVED,
            refund_amount=Decimal("250"),
            created_at=2,
        )
        summary = build_return_summary(
            [pending, approved],
            order_status=OrderStatus.RETURN_REQUESTED,
            return_requested_order_status=OrderStatus.RETURN_REQUESTED,
            pending_return_status=OrderReturnStatus.REQUESTED,
            approved_return_status=OrderReturnStatus.APPROVED,
            return_status_choices=OrderReturnStatus.choices,
        )
        self.assertTrue(summary["has_pending_return"])
        self.assertEqual(summary["pending_return_id"], 10)
        self.assertEqual(summary["approved_refund_total"], Decimal("250.00"))
        self.assertTrue(summary["can_review_return"])


class OrderSerializerDisplayFieldsTests(SimpleTestCase):
    def test_list_serializer_includes_return_summary_keys(self):
        field_names = set(OrderListSerializer().fields.keys())
        self.assertIn("return_summary", field_names)
        self.assertIn("paid_amount", field_names)
        self.assertIn("cancelled_by_name", field_names)

    def test_detail_serializer_includes_return_summary_keys(self):
        field_names = set(OrderDetailSerializer().fields.keys())
        self.assertIn("return_summary", field_names)
        self.assertIn("cancelled_by_name", field_names)

"""Tests return/cancel display fields on purchase order serializers."""

from apps.purchase_orders.serializers import (
    PurchaseOrderDetailSerializer,
    PurchaseOrderItemReadSerializer,
    PurchaseOrderListSerializer,
)
from django.test import SimpleTestCase


class PurchaseOrderSerializerDisplayFieldsTests(SimpleTestCase):
    def test_list_serializer_includes_return_summary_keys(self):
        field_names = set(PurchaseOrderListSerializer().fields.keys())
        self.assertIn("return_summary", field_names)
        self.assertIn("cancelled_by_name", field_names)
        self.assertIn("cancelled_at", field_names)

    def test_detail_serializer_includes_return_summary_keys(self):
        field_names = set(PurchaseOrderDetailSerializer().fields.keys())
        self.assertIn("return_summary", field_names)
        self.assertIn("cancelled_by_name", field_names)

    def test_item_read_serializer_includes_return_status_fields(self):
        field_names = set(PurchaseOrderItemReadSerializer().fields.keys())
        for key in (
            "return_status",
            "return_status_label",
            "pending_return_quantity",
            "returned_quantity",
            "returnable_quantity",
        ):
            self.assertIn(key, field_names)

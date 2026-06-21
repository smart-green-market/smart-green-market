"""Tests tách phiếu nhập theo NCC."""

from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

from django.test import SimpleTestCase

from apps.purchase_orders.services import group_items_by_supplier, merge_purchase_order_items


def _product(pid, supplier_id, name="SP"):
    return SimpleNamespace(id=pid, supplier_id=supplier_id, name=name)


class MergePurchaseOrderItemsTests(SimpleTestCase):
    def test_merges_duplicate_product_quantities(self):
        p = _product(1, 10)
        rows = [
            {"supplier_product": p, "quantity": Decimal("5"), "note": "a"},
            {"supplier_product": p, "quantity": Decimal("3"), "note": "b"},
        ]
        merged = merge_purchase_order_items(rows)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["quantity"], Decimal("8"))
        self.assertIn("a", merged[0]["note"])
        self.assertIn("b", merged[0]["note"])


class GroupItemsBySupplierTests(SimpleTestCase):
    def test_groups_by_supplier_id(self):
        rows = [
            {"supplier_product": _product(1, 10), "quantity": Decimal("1"), "note": ""},
            {"supplier_product": _product(2, 20), "quantity": Decimal("2"), "note": ""},
            {"supplier_product": _product(3, 10), "quantity": Decimal("3"), "note": ""},
        ]
        groups = group_items_by_supplier(rows)
        self.assertEqual(set(groups.keys()), {10, 20})
        self.assertEqual(len(groups[10]), 2)
        self.assertEqual(len(groups[20]), 1)
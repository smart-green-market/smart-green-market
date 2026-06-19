"""Tests favorite_category khi buyer đặt hàng."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from apps.customers.services import resolve_favorite_category_id, update_favorite_category_from_order


def _product(category_id):
    return SimpleNamespace(category_id=category_id)


def _item(product, quantity):
    return {"dealer_product": product, "quantity": quantity}


class ResolveFavoriteCategoryTests(SimpleTestCase):
    def test_picks_category_with_highest_quantity(self):
        items = [
            _item(_product(1), 2),
            _item(_product(2), 5),
            _item(_product(1), 1),
        ]
        self.assertEqual(resolve_favorite_category_id(items), 2)

    def test_tie_breaks_by_lower_category_id(self):
        items = [
            _item(_product(3), 2),
            _item(_product(1), 2),
        ]
        self.assertEqual(resolve_favorite_category_id(items), 1)

    def test_skips_products_without_category(self):
        items = [
            _item(_product(None), 10),
            _item(_product(5), 1),
        ]
        self.assertEqual(resolve_favorite_category_id(items), 5)

    def test_all_without_category_returns_none(self):
        self.assertIsNone(resolve_favorite_category_id([_item(_product(None), 3)]))


class UpdateFavoriteCategoryTests(SimpleTestCase):
    @patch("apps.customers.services.resolve_favorite_category_id", return_value=7)
    def test_updates_when_changed(self, _mock_resolve):
        customer = Mock(favorite_category_id=3)
        update_favorite_category_from_order(customer, [])
        customer.save.assert_called_once_with(
            update_fields=["favorite_category", "updated_at"]
        )
        self.assertEqual(customer.favorite_category_id, 7)

    @patch("apps.customers.services.resolve_favorite_category_id", return_value=3)
    def test_skips_save_when_unchanged(self, _mock_resolve):
        customer = Mock(favorite_category_id=3)
        update_favorite_category_from_order(customer, [])
        customer.save.assert_not_called()

    @patch("apps.customers.services.resolve_favorite_category_id", return_value=None)
    def test_skips_when_no_category(self, _mock_resolve):
        customer = Mock(favorite_category_id=3)
        update_favorite_category_from_order(customer, [])
        customer.save.assert_not_called()

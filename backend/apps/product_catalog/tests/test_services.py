"""Tests filter danh sách Product Master."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from apps.accounts.models import AccountRole
from apps.product_catalog.services import (
    apply_product_master_list_filters,
    parse_optional_category_id,
)


class ParseOptionalCategoryIdTests(SimpleTestCase):
    def test_none_or_empty_returns_none(self):
        self.assertIsNone(parse_optional_category_id(None))
        self.assertIsNone(parse_optional_category_id(""))
        self.assertIsNone(parse_optional_category_id("   "))

    def test_valid_integer(self):
        self.assertEqual(parse_optional_category_id("12"), 12)

    def test_rejects_invalid(self):
        with self.assertRaises(ValidationError):
            parse_optional_category_id("abc")
        with self.assertRaises(ValidationError):
            parse_optional_category_id("0")


class ApplyProductMasterListFiltersTests(SimpleTestCase):
    def _chain(self):
        qs = Mock()
        qs.filter.return_value = qs
        return qs

    @patch("apps.product_catalog.services.ProductMasterStatus")
    @patch("apps.product_catalog.services.CategoryStatus")
    def test_no_category_id_filters_active_for_non_admin(self, _cat_status, _master_status):
        qs = self._chain()
        user = SimpleNamespace(role=AccountRole.SUPPLIER)

        apply_product_master_list_filters(qs, user=user, category_id_raw=None)

        qs.filter.assert_called_once()

    def test_category_id_applied_before_role_filter(self):
        qs = self._chain()
        user = SimpleNamespace(role=AccountRole.ADMIN)

        apply_product_master_list_filters(qs, user=user, category_id_raw="5")

        qs.filter.assert_called_once_with(category_id=5)

    def test_admin_without_category_does_not_filter(self):
        qs = self._chain()
        user = SimpleNamespace(role=AccountRole.ADMIN)

        result = apply_product_master_list_filters(qs, user=user, category_id_raw=None)

        qs.filter.assert_not_called()
        self.assertIs(result, qs)

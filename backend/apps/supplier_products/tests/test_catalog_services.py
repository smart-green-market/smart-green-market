"""Tests rule catalog SupplierProduct."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from apps.categories.models import CategoryScope
from apps.product_catalog.models import ProductMasterStatus
from apps.supplier_products.catalog_services import apply_supplier_product_catalog_rules


def _category(scope, pk=1, status="active"):
    return SimpleNamespace(
        id=pk,
        scope=scope,
        status=status,
        created_by_id=10,
    )


def _master(pk=5, category_id=1, name="Cà chua", unit="kg"):
    return SimpleNamespace(
        id=pk,
        category_id=category_id,
        name=name,
        default_unit=unit,
        status=ProductMasterStatus.ACTIVE,
    )


class ApplySupplierProductCatalogRulesTests(SimpleTestCase):
    def setUp(self):
        self.user = Mock(id=10)
        self.supplier = Mock(id=1)

    @patch("apps.supplier_products.catalog_services.category_assignable_by_user", return_value=True)
    @patch("apps.supplier_products.catalog_services._ensure_unique_master_link")
    @patch("apps.supplier_products.catalog_services.generate_supplier_product_slug", return_value="ca-chua")
    def test_system_category_requires_master(self, *_mocks):
        with self.assertRaises(ValidationError) as ctx:
            apply_supplier_product_catalog_rules(
                user=self.user,
                category=_category(CategoryScope.SYSTEM),
                product_master=None,
                name="",
                unit="",
                supplier=self.supplier,
            )
        self.assertIn("product_master", ctx.exception.detail)

    @patch("apps.supplier_products.catalog_services.category_assignable_by_user", return_value=True)
    @patch("apps.supplier_products.catalog_services._ensure_unique_master_link")
    @patch("apps.supplier_products.catalog_services.generate_supplier_product_slug", return_value="ca-chua")
    def test_system_category_uses_master_name(self, *_mocks):
        master = _master()
        result = apply_supplier_product_catalog_rules(
            user=self.user,
            category=_category(CategoryScope.SYSTEM),
            product_master=master,
            name="ignored",
            unit="ignored",
            supplier=self.supplier,
        )
        self.assertEqual(result["name"], "Cà chua")
        self.assertEqual(result["unit"], "kg")
        self.assertEqual(result["product_master"], master)

    @patch("apps.supplier_products.catalog_services.category_assignable_by_user", return_value=True)
    @patch("apps.supplier_products.catalog_services.generate_supplier_product_slug", return_value="custom")
    def test_custom_category_requires_name(self, *_mocks):
        with self.assertRaises(ValidationError) as ctx:
            apply_supplier_product_catalog_rules(
                user=self.user,
                category=_category(CategoryScope.CUSTOM),
                product_master=None,
                name="",
                unit="kg",
                supplier=self.supplier,
            )
        self.assertIn("name", ctx.exception.detail)

    @patch("apps.supplier_products.catalog_services.category_assignable_by_user", return_value=True)
    @patch("apps.supplier_products.catalog_services._ensure_unique_master_link")
    @patch("apps.supplier_products.catalog_services.generate_supplier_product_slug", return_value="custom")
    def test_custom_category_keeps_supplier_name(self, *_mocks):
        master = _master()
        result = apply_supplier_product_catalog_rules(
            user=self.user,
            category=_category(CategoryScope.CUSTOM),
            product_master=master,
            name="Cà chua bi nhà kính loại A",
            unit="kg",
            supplier=self.supplier,
        )
        self.assertEqual(result["name"], "Cà chua bi nhà kính loại A")
        self.assertEqual(result["product_master"], master)

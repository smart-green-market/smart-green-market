"""Tests soft-delete danh mục."""

from django.test import TestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.archive import soft_delete_category
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.dealer_products.models import DealerProductStatus
from apps.product_catalog.models import ProductMaster, ProductMasterStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus


class CategorySoftDeleteTests(TestCase):
    def setUp(self):
        self.admin = Account.objects.create_user(
            username="admin_cat_sd",
            email="admin_cat_sd@test.com",
            password="pass",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        self.category = Category.objects.create(
            name="Danh mục trống",
            scope=CategoryScope.CUSTOM,
            status=CategoryStatus.ACTIVE,
            created_by=self.admin,
        )

    def test_soft_delete_empty_category(self):
        soft_delete_category(self.category, self.admin)
        self.category.refresh_from_db()
        self.assertEqual(self.category.status, CategoryStatus.DELETED)

    def test_blocked_by_supplier_product(self):
        supplier_account = Account.objects.create_user(
            username="sup_cat_sd",
            email="sup_cat_sd@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Cat",
            tax_code="3333333333",
            phone="0900000003",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        SupplierProduct.objects.create(
            supplier=supplier,
            category=self.category,
            name="SP Cat",
            slug="sp-cat",
            unit="kg",
            status=SupplierProductStatus.ACTIVE,
        )
        with self.assertRaises(ValidationError) as ctx:
            soft_delete_category(self.category, self.admin)
        self.assertEqual(ctx.exception.detail["code"], "has_linked_products")
        self.assertEqual(int(ctx.exception.detail["supplier_products"]), 1)

    def test_blocked_by_product_master(self):
        ProductMaster.objects.create(
            category=self.category,
            name="Master Cat",
            slug="master-cat",
            default_unit="kg",
            status=ProductMasterStatus.ACTIVE,
        )
        with self.assertRaises(ValidationError) as ctx:
            soft_delete_category(self.category, self.admin)
        self.assertEqual(ctx.exception.detail["code"], "has_linked_products")
        self.assertEqual(int(ctx.exception.detail["product_masters"]), 1)

    def test_ignores_deleted_supplier_products(self):
        supplier_account = Account.objects.create_user(
            username="sup_cat_sd2",
            email="sup_cat_sd2@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Cat2",
            tax_code="4444444444",
            phone="0900000004",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        SupplierProduct.objects.create(
            supplier=supplier,
            category=self.category,
            name="SP Deleted",
            slug="sp-deleted",
            unit="kg",
            status=SupplierProductStatus.DELETED,
        )
        soft_delete_category(self.category, self.admin)
        self.category.refresh_from_db()
        self.assertEqual(self.category.status, CategoryStatus.DELETED)

    def test_list_excludes_deleted_by_default(self):
        Category.objects.create(
            name="Đã xóa",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.DELETED,
        )
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get("/api/categories/")
        self.assertEqual(response.status_code, 200)
        names = {item["name"] for item in response.data["results"]}
        self.assertNotIn("Đã xóa", names)

    def test_list_shows_deleted_with_status_param(self):
        deleted = Category.objects.create(
            name="Xem deleted",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.DELETED,
        )
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get("/api/categories/?status=deleted")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data["results"]}
        self.assertIn(deleted.id, ids)

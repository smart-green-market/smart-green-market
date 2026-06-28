"""Tests lọc danh mục mặc định cho dealer/supplier."""

from django.test import TestCase

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.categories.views import CategoryViewSet
from common.status_counts import filter_by_status_param
from rest_framework.test import APIRequestFactory


class CategoryListDefaultFilterTests(TestCase):
    def setUp(self):
        self.dealer = Account.objects.create_user(
            username="dealer_cat",
            email="dealer_cat@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.system_active = Category.objects.create(
            name="System Active",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        Category.objects.create(
            name="System Pending",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.PENDING,
        )
        self.custom_active = Category.objects.create(
            name="Custom Active",
            scope=CategoryScope.CUSTOM,
            status=CategoryStatus.ACTIVE,
            created_by=self.dealer,
        )
        Category.objects.create(
            name="Custom Pending",
            scope=CategoryScope.CUSTOM,
            status=CategoryStatus.PENDING,
            created_by=self.dealer,
        )
        Category.objects.create(
            name="Custom Rejected",
            scope=CategoryScope.CUSTOM,
            status=CategoryStatus.REJECTED,
            created_by=self.dealer,
        )

    def _dealer_base_qs(self):
        factory = APIRequestFactory()
        request = factory.get("/api/categories/")
        request.user = self.dealer
        view = CategoryViewSet()
        view.request = request
        view.action = "list"
        return view.get_queryset()

    def test_default_list_only_active_for_dealer(self):
        base_qs = self._dealer_base_qs()
        qs = base_qs.filter(status=CategoryStatus.ACTIVE)
        names = set(qs.values_list("name", flat=True))
        self.assertEqual(names, {"System Active", "Custom Active"})

    def test_status_param_shows_pending_custom(self):
        base_qs = self._dealer_base_qs()
        qs = filter_by_status_param(base_qs, CategoryStatus.PENDING, field="status")
        names = set(qs.values_list("name", flat=True))
        self.assertEqual(names, {"Custom Pending"})

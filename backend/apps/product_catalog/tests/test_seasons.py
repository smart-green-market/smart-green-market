"""Tests Season và filter Product Master theo mùa."""

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.product_catalog.models import ProductMaster, Season
from apps.product_catalog.services import (
    season_ids_for_month,
    season_includes_month,
    validate_month,
)


class SeasonMonthLogicTests(TestCase):
    def test_season_includes_month_normal_range(self):
        self.assertTrue(season_includes_month(start_month=4, end_month=6, month=5))

    def test_season_includes_month_wrap_year(self):
        self.assertTrue(season_includes_month(start_month=11, end_month=2, month=12))
        self.assertTrue(season_includes_month(start_month=11, end_month=2, month=1))
        self.assertFalse(season_includes_month(start_month=11, end_month=2, month=6))

    def test_validate_month_rejects_invalid(self):
        with self.assertRaises(ValidationError):
            validate_month(0, field="start_month")
        with self.assertRaises(ValidationError):
            validate_month(13, field="end_month")


class SeasonSeedAndFilterTests(TestCase):
    def setUp(self):
        self.spring = Season.objects.create(
            code="test_spring",
            name="Xuân test",
            start_month=1,
            end_month=3,
        )
        self.wrap = Season.objects.create(
            code="test_wrap",
            name="Qua năm test",
            start_month=11,
            end_month=2,
        )

    def test_season_ids_for_month(self):
        feb_ids = season_ids_for_month(2)
        self.assertIn(self.spring.id, feb_ids)
        self.assertIn(self.wrap.id, feb_ids)

        jun_ids = season_ids_for_month(6)
        self.assertNotIn(self.spring.id, jun_ids)
        self.assertNotIn(self.wrap.id, jun_ids)


class ProductMasterSeasonLinkTests(TestCase):
    def test_product_master_can_link_multiple_seasons(self):
        season_a = Season.objects.create(
            code="link_a",
            name="A",
            start_month=1,
            end_month=3,
        )
        season_b = Season.objects.create(
            code="link_b",
            name="B",
            start_month=4,
            end_month=6,
        )
        category = Category.objects.create(
            name="Cat season",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        master = ProductMaster.objects.create(
            category=category,
            name="Test SP",
            slug="test-sp-season",
            default_unit="kg",
        )
        master.seasons.set([season_a, season_b])
        self.assertEqual(master.seasons.count(), 2)

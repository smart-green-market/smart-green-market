"""Tests ghi nhận tương tác buyer trên storefront."""

from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.marketing.services import (
    POINTS_ADD_CART,
    POINTS_PURCHASE,
    POINTS_VIEW,
    VIEW_DEBOUNCE_SECONDS,
    compute_engagement_score,
    track_interaction,
    track_purchase_interactions_for_order,
)


def _interaction(**kwargs):
    defaults = {
        "view_count": 0,
        "add_cart_count": 0,
        "purchase_count": 0,
        "last_viewed_at": None,
        "last_added_at": None,
        "last_purchased_at": None,
        "dealer_id": 1,
        "save": Mock(),
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


class ComputeEngagementScoreTests(SimpleTestCase):
    def test_weighted_sum(self):
        interaction = _interaction(view_count=2, add_cart_count=1, purchase_count=1)
        expected = 2 * POINTS_VIEW + 1 * POINTS_ADD_CART + 1 * POINTS_PURCHASE
        self.assertEqual(compute_engagement_score(interaction), expected)


class TrackInteractionViewTests(SimpleTestCase):
    @patch("apps.marketing.services._get_or_create_interaction")
    @patch("apps.marketing.services.resolve_storefront_dealer_product")
    def test_records_first_view(self, _mock_product, mock_get):
        interaction = _interaction()
        mock_get.return_value = interaction

        result = track_interaction(
            customer=Mock(),
            dealer=Mock(id=1),
            dealer_product_id=5,
            action="view",
        )

        self.assertTrue(result.recorded)
        self.assertEqual(result.view_count, 1)
        self.assertEqual(result.engagement_score, POINTS_VIEW)
        interaction.save.assert_called_once()

    @patch("apps.marketing.services._get_or_create_interaction")
    @patch("apps.marketing.services.resolve_storefront_dealer_product")
    def test_debounces_repeat_view(self, _mock_product, mock_get):
        now = timezone.now()
        interaction = _interaction(
            view_count=1,
            last_viewed_at=now - timedelta(seconds=30),
        )
        mock_get.return_value = interaction

        result = track_interaction(
            customer=Mock(),
            dealer=Mock(id=1),
            dealer_product_id=5,
            action="view",
        )

        self.assertFalse(result.recorded)
        self.assertEqual(result.reason, "view_debounced")
        self.assertIsNotNone(result.retry_after_seconds)
        self.assertLessEqual(result.retry_after_seconds, VIEW_DEBOUNCE_SECONDS)
        interaction.save.assert_not_called()

    @patch("apps.marketing.services._get_or_create_interaction")
    @patch("apps.marketing.services.resolve_storefront_dealer_product")
    def test_records_view_after_debounce_window(self, _mock_product, mock_get):
        interaction = _interaction(
            view_count=1,
            last_viewed_at=timezone.now() - timedelta(seconds=VIEW_DEBOUNCE_SECONDS + 1),
        )
        mock_get.return_value = interaction

        result = track_interaction(
            customer=Mock(),
            dealer=Mock(id=1),
            dealer_product_id=5,
            action="view",
        )

        self.assertTrue(result.recorded)
        self.assertEqual(result.view_count, 2)
        interaction.save.assert_called_once()


class TrackInteractionAddCartTests(SimpleTestCase):
    @patch("apps.marketing.services._get_or_create_interaction")
    @patch("apps.marketing.services.resolve_storefront_dealer_product")
    def test_records_first_add_cart(self, _mock_product, mock_get):
        interaction = _interaction()
        mock_get.return_value = interaction

        result = track_interaction(
            customer=Mock(),
            dealer=Mock(id=1),
            dealer_product_id=5,
            action="add_cart",
        )

        self.assertTrue(result.recorded)
        self.assertEqual(result.add_cart_count, 1)
        self.assertEqual(result.engagement_score, POINTS_ADD_CART)
        interaction.save.assert_called_once()

    @patch("apps.marketing.services._get_or_create_interaction")
    @patch("apps.marketing.services.resolve_storefront_dealer_product")
    def test_skips_duplicate_add_cart(self, _mock_product, mock_get):
        interaction = _interaction(add_cart_count=1)
        mock_get.return_value = interaction

        result = track_interaction(
            customer=Mock(),
            dealer=Mock(id=1),
            dealer_product_id=5,
            action="add_cart",
        )

        self.assertFalse(result.recorded)
        self.assertEqual(result.reason, "add_cart_already_recorded")
        interaction.save.assert_not_called()


class TrackInteractionValidationTests(SimpleTestCase):
    def test_rejects_purchase_action(self):
        with self.assertRaises(ValidationError):
            track_interaction(
                customer=Mock(),
                dealer=Mock(id=1),
                dealer_product_id=5,
                action="purchase",
            )


class TrackPurchaseForOrderTests(SimpleTestCase):
    @patch("apps.marketing.services._get_or_create_interaction")
    def test_increments_once_per_product(self, mock_get):
        product_a = SimpleNamespace(id=1)
        product_b = SimpleNamespace(id=2)
        interaction_a = _interaction()
        interaction_b = _interaction()
        mock_get.side_effect = [interaction_a, interaction_b]

        track_purchase_interactions_for_order(
            customer=Mock(),
            dealer=Mock(id=1),
            validated_items=[
                {"dealer_product": product_a, "quantity": 2},
                {"dealer_product": product_a, "quantity": 1},
                {"dealer_product": product_b, "quantity": 1},
            ],
        )

        self.assertEqual(interaction_a.purchase_count, 1)
        self.assertEqual(interaction_b.purchase_count, 1)
        interaction_a.save.assert_called_once()
        interaction_b.save.assert_called_once()

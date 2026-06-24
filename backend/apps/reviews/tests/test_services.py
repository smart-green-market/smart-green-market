"""Tests logic đánh giá sản phẩm."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from apps.reviews.services import get_pending_review_items, get_review_summary


class GetReviewSummaryTests(SimpleTestCase):
    @patch("apps.reviews.services.ProductReview.objects")
    def test_empty_summary(self, mock_objects):
        mock_objects.filter.return_value.aggregate.return_value = {
            "average_rating": None,
            "review_count": 0,
        }
        mock_objects.filter.return_value.values.return_value.annotate.return_value = []

        result = get_review_summary(dealer=Mock(), dealer_product_id=1)
        self.assertEqual(result["review_count"], 0)
        self.assertIsNone(result["average_rating"])


class GetPendingReviewItemsTests(SimpleTestCase):
    @patch("apps.reviews.services.ProductReview.objects")
    @patch("apps.reviews.services.Order.objects")
    def test_lists_unreviewed_products(self, mock_order_qs, mock_review_objects):
        item = SimpleNamespace(dealer_product_id=5, product_title="Rau")
        order = SimpleNamespace(
            id=1,
            order_code="DH-001",
            completed_at=None,
            items=Mock(all=Mock(return_value=[item])),
        )
        mock_order_qs.filter.return_value.prefetch_related.return_value = [order]
        mock_review_objects.filter.return_value.values_list.return_value = []

        pending = get_pending_review_items(customer=Mock(), dealer=Mock())
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["dealer_product_id"], 5)

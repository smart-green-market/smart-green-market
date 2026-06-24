from django.urls import path

from .dealer_views import DealerProductReviewDetailView, DealerProductReviewListView

urlpatterns = [
    path(
        "dealer-product-reviews/",
        DealerProductReviewListView.as_view(),
        name="dealer-product-reviews",
    ),
    path(
        "dealer-product-reviews/<int:pk>/",
        DealerProductReviewDetailView.as_view(),
        name="dealer-product-review-detail",
    ),
]

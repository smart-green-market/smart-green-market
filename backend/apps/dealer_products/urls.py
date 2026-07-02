from django.urls import path
from rest_framework.routers import DefaultRouter

from .age_discount_views import AgeDiscountPolicyViewSet
from .related_recommendation_views import (
    DealerProductRelatedRecommendationByProductView,
    DealerProductRelatedRecommendationViewSet,
)
from .views import (
    DealerInventoryBatchViewSet,
    DealerInventoryTransactionViewSet,
    DealerProductImageViewSet,
    DealerProductViewSet,
)

router = DefaultRouter()
router.register("dealer-products", DealerProductViewSet, basename="dealer-product")
router.register("dealer-product-images", DealerProductImageViewSet, basename="dealer-product-image")
router.register("dealer-inventory-batches", DealerInventoryBatchViewSet, basename="dealer-inventory-batch")
router.register(
    "dealer-inventory-transactions",
    DealerInventoryTransactionViewSet,
    basename="dealer-inventory-transaction",
)
router.register("age-discount-policies", AgeDiscountPolicyViewSet, basename="age-discount-policy")
router.register(
    "dealer-product-related-recommendations",
    DealerProductRelatedRecommendationViewSet,
    basename="dealer-product-related-recommendation",
)

urlpatterns = [
    *router.urls,
    path(
        "dealer-products/<int:product_id>/related-recommendation/",
        DealerProductRelatedRecommendationByProductView.as_view(),
        name="dealer-product-related-recommendation-by-product",
    ),
]

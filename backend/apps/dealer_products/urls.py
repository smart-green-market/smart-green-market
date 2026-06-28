from rest_framework.routers import DefaultRouter

from .age_discount_views import AgeDiscountPolicyViewSet
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

urlpatterns = router.urls

from rest_framework.routers import DefaultRouter

from .quantity_discount_views import QuantityDiscountPolicyViewSet
from .views import SupplierProductViewSet, SupplierProductImageViewSet,CultivationProcessViewSet

router = DefaultRouter()
router.register(r"supplier-products", SupplierProductViewSet)
router.register(r"supplier-product-images", SupplierProductImageViewSet)
router.register(r"cultivation-processes", CultivationProcessViewSet)
router.register(
    r"quantity-discount-policies",
    QuantityDiscountPolicyViewSet,
    basename="quantity-discount-policy",
)

urlpatterns = router.urls
from rest_framework.routers import DefaultRouter

from .views import SupplierProductViewSet, SupplierProductImageViewSet,CultivationProcessViewSet

router = DefaultRouter()
router.register(r"supplier-products", SupplierProductViewSet)
router.register(r"supplier-product-images", SupplierProductImageViewSet)
router.register(r"cultivation-processes", CultivationProcessViewSet)

urlpatterns = router.urls
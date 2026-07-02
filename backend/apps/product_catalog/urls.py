from rest_framework.routers import DefaultRouter

from .views import ProductMasterViewSet

router = DefaultRouter()
router.register("product-masters", ProductMasterViewSet, basename="product-master")

urlpatterns = router.urls

from rest_framework.routers import DefaultRouter

from .views import ProductMasterViewSet, SeasonViewSet

router = DefaultRouter()
router.register("product-masters", ProductMasterViewSet, basename="product-master")
router.register("seasons", SeasonViewSet, basename="season")

urlpatterns = router.urls

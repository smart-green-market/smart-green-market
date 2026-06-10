from rest_framework.routers import DefaultRouter

from .views import DealerProfileViewSet

router = DefaultRouter()
router.register("dealers", DealerProfileViewSet, basename="dealer")

urlpatterns = router.urls

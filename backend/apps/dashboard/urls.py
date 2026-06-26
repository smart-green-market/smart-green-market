from rest_framework.routers import DefaultRouter

from .views import DealerDashboardViewSet

router = DefaultRouter()
router.register("dashboard/dealer", DealerDashboardViewSet, basename="dashboard-dealer")

urlpatterns = router.urls

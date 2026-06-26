from rest_framework.routers import DefaultRouter

from .views import DealerDashboardViewSet, SupplierDashboardViewSet

router = DefaultRouter()
router.register("dashboard/dealer", DealerDashboardViewSet, basename="dashboard-dealer")
router.register("dashboard/supplier", SupplierDashboardViewSet, basename="dashboard-supplier")

urlpatterns = router.urls

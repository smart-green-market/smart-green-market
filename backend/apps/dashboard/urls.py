from rest_framework.routers import DefaultRouter

from .views import DealerDashboardViewSet, SupplierDashboardViewSet, AdminDashboardViewSet

router = DefaultRouter()
router.register("dashboard/dealer", DealerDashboardViewSet, basename="dashboard-dealer")
router.register("dashboard/supplier", SupplierDashboardViewSet, basename="dashboard-supplier")
router.register("dashboard/admin", AdminDashboardViewSet, basename="dashboard-admin")

urlpatterns = router.urls

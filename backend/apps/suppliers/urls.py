from django.urls import path
from rest_framework.routers import DefaultRouter

from .finance_views import (
    AdminSupplierFinanceListView,
    AdminSupplierFinanceOverviewView,
)
from .views import SupplierViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet)

urlpatterns = [
    path(
        "suppliers/finance-overview/",
        AdminSupplierFinanceOverviewView.as_view(),
        name="supplier-finance-overview",
    ),
    path(
        "suppliers/finance/",
        AdminSupplierFinanceListView.as_view(),
        name="supplier-finance",
    ),
    *router.urls,
]

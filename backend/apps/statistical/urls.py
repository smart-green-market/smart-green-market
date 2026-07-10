from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DealerStatisticalViewSet

router = DefaultRouter()
router.register("statistical/dealer", DealerStatisticalViewSet, basename="statistical-dealer")

urlpatterns = [
    path("", include(router.urls)),
]

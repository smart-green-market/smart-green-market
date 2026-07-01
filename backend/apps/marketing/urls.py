from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerSegmentViewSet

router = DefaultRouter()
router.register("customer-segments", CustomerSegmentViewSet, basename="customer-segment")

urlpatterns = [
    path("", include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromotionViewSet

router = DefaultRouter()
router.register("vouchers", PromotionViewSet, basename="voucher")

urlpatterns = [
    path("", include(router.urls)),
]

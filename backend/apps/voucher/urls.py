from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AvailablePromotionsView, ApplyPromotionView, PromotionViewSet

router = DefaultRouter()
router.register("vouchers", PromotionViewSet, basename="voucher")

urlpatterns = [
    path("vouchers/available/", AvailablePromotionsView.as_view(), name="available-vouchers"),
    path("vouchers/apply/", ApplyPromotionView.as_view(), name="apply-voucher"),
    path("", include(router.urls)),
]

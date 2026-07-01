from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromotionViewSet, CartApplyVoucherView

router = DefaultRouter()
router.register("vouchers", PromotionViewSet, basename="voucher")

urlpatterns = [
    path("cart/apply-voucher/", CartApplyVoucherView.as_view(), name="cart-apply-voucher"),
    path("", include(router.urls)),
]

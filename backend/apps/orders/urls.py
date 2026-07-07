from rest_framework.routers import DefaultRouter

from .preorder_views import PreOrderRequestViewSet
from .views import CustomerOrderViewSet

router = DefaultRouter()
router.register("customer-orders", CustomerOrderViewSet, basename="customer-order")
router.register("preorder-requests", PreOrderRequestViewSet, basename="preorder-request")

urlpatterns = router.urls

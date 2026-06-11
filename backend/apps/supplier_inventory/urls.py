from rest_framework.routers import DefaultRouter

from .views import (
    InventoryBatchViewSet,
    InventoryWastageViewSet,
)

router = DefaultRouter()

router.register(
    r"supplier-batches",
    InventoryBatchViewSet,
)

router.register(
    r"supplier-wastages",
    InventoryWastageViewSet,
)

urlpatterns = router.urls
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, SupplierDocumentViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet)
router.register("supplier-documents", SupplierDocumentViewSet)

urlpatterns = router.urls
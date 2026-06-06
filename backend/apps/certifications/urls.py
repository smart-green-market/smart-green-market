from rest_framework.routers import DefaultRouter

from .views import CertificationViewSet

router = DefaultRouter()

router.register(
    "certifications",
    CertificationViewSet,
    basename="certification"
)

urlpatterns = router.urls
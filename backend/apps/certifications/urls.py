from rest_framework.routers import DefaultRouter

from .views import CertificationViewSet, CertificationImageViewSet

router = DefaultRouter()

router.register(
    "certifications",
    CertificationViewSet,
    basename="certification",
)
router.register(
    "certification-images",
    CertificationImageViewSet,
    basename="certification-image",
)

urlpatterns = router.urls

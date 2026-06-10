from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .document_views import AccountDocumentViewSet
from .views import (
    RegisterView,
    LoginView,
    RefreshView,
    VerifyView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
    AvatarView,
)

router = DefaultRouter()
router.register("account-documents", AccountDocumentViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("verify/", VerifyView.as_view()),
    path("logout/", LogoutView.as_view()),

    path("profile/", ProfileView.as_view()),
    path("profile/avatar/", AvatarView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
]
from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    RefreshView,
    VerifyView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("verify/", VerifyView.as_view()),
    path("logout/", LogoutView.as_view()),

    path("profile/", ProfileView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
]
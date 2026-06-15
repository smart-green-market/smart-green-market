from django.urls import path
from rest_framework.routers import DefaultRouter

from .storefront_views import StorefrontLoginView, StorefrontRegisterView
from .views import (
    DealerCustomerViewSet,
    StorefrontCustomerAddressViewSet,
    StorefrontCustomerProfileViewSet,
)

router = DefaultRouter()
router.register("dealer-customers", DealerCustomerViewSet, basename="dealer-customer")

storefront_profile = StorefrontCustomerProfileViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
})
storefront_addresses = StorefrontCustomerAddressViewSet.as_view({
    "get": "list",
    "post": "create",
})
storefront_address_detail = StorefrontCustomerAddressViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

urlpatterns = [
    path(
        "storefronts/<slug:dealer_slug>/register/",
        StorefrontRegisterView.as_view(),
        name="storefront-register",
    ),
    path(
        "storefronts/<slug:dealer_slug>/login/",
        StorefrontLoginView.as_view(),
        name="storefront-login",
    ),
    path(
        "storefronts/<slug:dealer_slug>/me/",
        storefront_profile,
        name="storefront-me",
    ),
    path(
        "storefronts/<slug:dealer_slug>/addresses/",
        storefront_addresses,
        name="storefront-addresses",
    ),
    path(
        "storefronts/<slug:dealer_slug>/addresses/<int:pk>/",
        storefront_address_detail,
        name="storefront-address-detail",
    ),
    *router.urls,
]

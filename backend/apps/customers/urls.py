from django.urls import path
from rest_framework.routers import DefaultRouter

from .storefront_views import StorefrontLoginView, StorefrontRegisterView
from .storefront_catalog_views import (
    StorefrontCategoryListView,
    StorefrontProductDetailView,
    StorefrontProductListView,
)
from apps.marketing.storefront_views import StorefrontInteractionTrackView
from apps.reviews.storefront_views import (
    StorefrontPendingReviewsView,
    StorefrontProductReviewListView,
    StorefrontProductReviewSummaryView,
    StorefrontReviewDetailView,
    StorefrontReviewImageDetailView,
    StorefrontReviewImagesView,
    StorefrontReviewListCreateView,
)
from apps.orders.storefront_views import (
    StorefrontDeliverySlotsView,
    StorefrontOrderConfirmReceivedView,
    StorefrontOrderDetailView,
    StorefrontOrderListCreateView,
)
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
        "storefronts/<slug:dealer_slug>/categories/",
        StorefrontCategoryListView.as_view(),
        name="storefront-categories",
    ),
    path(
        "storefronts/<slug:dealer_slug>/products/",
        StorefrontProductListView.as_view(),
        name="storefront-products",
    ),
    path(
        "storefronts/<slug:dealer_slug>/products/<int:product_id>/",
        StorefrontProductDetailView.as_view(),
        name="storefront-product-detail",
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
    path(
        "storefronts/<slug:dealer_slug>/reviews/",
        StorefrontReviewListCreateView.as_view(),
        name="storefront-reviews",
    ),
    path(
        "storefronts/<slug:dealer_slug>/reviews/<int:pk>/",
        StorefrontReviewDetailView.as_view(),
        name="storefront-review-detail",
    ),
    path(
        "storefronts/<slug:dealer_slug>/reviews/<int:pk>/images/",
        StorefrontReviewImagesView.as_view(),
        name="storefront-review-images",
    ),
    path(
        "storefronts/<slug:dealer_slug>/reviews/<int:pk>/images/<int:image_id>/",
        StorefrontReviewImageDetailView.as_view(),
        name="storefront-review-image-detail",
    ),
    path(
        "storefronts/<slug:dealer_slug>/me/pending-reviews/",
        StorefrontPendingReviewsView.as_view(),
        name="storefront-pending-reviews",
    ),
    path(
        "storefronts/<slug:dealer_slug>/products/<int:product_id>/reviews/",
        StorefrontProductReviewListView.as_view(),
        name="storefront-product-reviews",
    ),
    path(
        "storefronts/<slug:dealer_slug>/products/<int:product_id>/reviews/summary/",
        StorefrontProductReviewSummaryView.as_view(),
        name="storefront-product-reviews-summary",
    ),
    path(
        "storefronts/<slug:dealer_slug>/interactions/",
        StorefrontInteractionTrackView.as_view(),
        name="storefront-interactions",
    ),
    path(
        "storefronts/<slug:dealer_slug>/delivery-slots/",
        StorefrontDeliverySlotsView.as_view(),
        name="storefront-delivery-slots",
    ),
    path(
        "storefronts/<slug:dealer_slug>/orders/",
        StorefrontOrderListCreateView.as_view(),
        name="storefront-orders",
    ),
    path(
        "storefronts/<slug:dealer_slug>/orders/<int:pk>/",
        StorefrontOrderDetailView.as_view(),
        name="storefront-order-detail",
    ),
    path(
        "storefronts/<slug:dealer_slug>/orders/<int:pk>/confirm-received/",
        StorefrontOrderConfirmReceivedView.as_view(),
        name="storefront-order-confirm-received",
    ),
    *router.urls,
]

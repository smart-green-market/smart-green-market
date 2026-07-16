from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DealerCustomerAdjustLoyaltyView,
    DealerCustomerLoyaltyTransactionsView,
    DealerCustomerTierHistoryView,
    DealerLoyaltySettingsViewSet,
    LoyaltyTierViewSet,
    StorefrontLoyaltyStatusView,
    StorefrontLoyaltyTierListView,
    StorefrontLoyaltyTransactionListView,
)

router = DefaultRouter()
router.register("loyalty-tiers", LoyaltyTierViewSet, basename="loyalty-tier")
router.register(
    "loyalty-settings",
    DealerLoyaltySettingsViewSet,
    basename="loyalty-settings",
)

urlpatterns = [
    path(
        "storefronts/<slug:dealer_slug>/loyalty/tiers/",
        StorefrontLoyaltyTierListView.as_view(),
        name="storefront-loyalty-tiers",
    ),
    path(
        "storefronts/<slug:dealer_slug>/me/loyalty/",
        StorefrontLoyaltyStatusView.as_view(),
        name="storefront-me-loyalty",
    ),
    path(
        "storefronts/<slug:dealer_slug>/me/loyalty/transactions/",
        StorefrontLoyaltyTransactionListView.as_view(),
        name="storefront-me-loyalty-transactions",
    ),
    path(
        "dealer-customers/<int:pk>/loyalty-transactions/",
        DealerCustomerLoyaltyTransactionsView.as_view(),
        name="dealer-customer-loyalty-transactions",
    ),
    path(
        "dealer-customers/<int:pk>/tier-histories/",
        DealerCustomerTierHistoryView.as_view(),
        name="dealer-customer-tier-histories",
    ),
    path(
        "dealer-customers/<int:pk>/adjust-loyalty-points/",
        DealerCustomerAdjustLoyaltyView.as_view(),
        name="dealer-customer-adjust-loyalty",
    ),
    *router.urls,
]

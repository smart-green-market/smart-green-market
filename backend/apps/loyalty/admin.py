from django.contrib import admin

from .models import (
    CustomerTierHistory,
    DealerLoyaltySettings,
    LoyaltyPointTransaction,
    LoyaltyTier,
)


@admin.register(DealerLoyaltySettings)
class DealerLoyaltySettingsAdmin(admin.ModelAdmin):
    list_display = ("dealer", "points_per_unit", "is_active", "updated_at")


@admin.register(LoyaltyTier)
class LoyaltyTierAdmin(admin.ModelAdmin):
    list_display = ("dealer", "code", "name", "level", "min_points", "is_active", "is_system")
    list_filter = ("is_active", "is_system")
    search_fields = ("code", "name", "dealer__store_name")


@admin.register(LoyaltyPointTransaction)
class LoyaltyPointTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "customer_profile",
        "dealer",
        "transaction_type",
        "points",
        "balance_after",
        "created_at",
    )
    list_filter = ("transaction_type",)
    search_fields = ("customer_profile__user__email", "order__order_code")


@admin.register(CustomerTierHistory)
class CustomerTierHistoryAdmin(admin.ModelAdmin):
    list_display = ("customer_profile", "old_tier", "new_tier", "changed_at")

from django.contrib import admin

from .models import CustomerAddress, CustomerProfile


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "total_orders",
        "total_spent",
        "loyalty_points",
        "current_tier",
        "last_order_at",
    )
    search_fields = (
        "user__username",
        "user__email",
        "user__full_name",
        "user__phone",
        "user__store_dealer__store_name",
    )
    list_select_related = ("user", "user__store_dealer", "favorite_category")
    list_filter = ("user__store_dealer",)


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "receiver_name", "receiver_phone", "is_default")
    search_fields = ("receiver_name", "receiver_phone", "address", "customer__user__username")
    list_filter = ("is_default",)
    list_select_related = ("customer", "customer__user")

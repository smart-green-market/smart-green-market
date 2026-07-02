from django.contrib import admin

from .models import (
    CustomerInteraction,
    CustomerSegment,
    CustomerSegmentMember,
    DealerSupplierProductInteraction,
)


class CustomerSegmentMemberInline(admin.TabularInline):
    model = CustomerSegmentMember
    extra = 0


@admin.register(CustomerSegment)
class CustomerSegmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_system", "created_at")
    list_filter = ["is_system"]
    search_fields = ("name", "code", "description")
    inlines = [CustomerSegmentMemberInline]


@admin.register(CustomerInteraction)
class CustomerInteractionAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "dealer_product",
        "view_count",
        "add_cart_count",
        "purchase_count",
        "updated_at",
    )
    list_filter = ("dealer",)


@admin.register(DealerSupplierProductInteraction)
class DealerSupplierProductInteractionAdmin(admin.ModelAdmin):
    list_display = (
        "dealer",
        "supplier_product",
        "view_count",
        "add_cart_count",
        "purchase_count",
        "updated_at",
    )
    list_filter = ("supplier", "dealer")

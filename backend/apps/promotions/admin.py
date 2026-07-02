from django.contrib import admin

from .models import CustomerSavedVoucher, Promotion, PromotionTarget, PromotionUsage


class PromotionTargetInline(admin.TabularInline):
    model = PromotionTarget
    extra = 0


class PromotionUsageInline(admin.TabularInline):
    model = PromotionUsage
    extra = 0
    readonly_fields = ("order", "discount_amount", "created_at")


class CustomerSavedVoucherInline(admin.TabularInline):
    model = CustomerSavedVoucher
    extra = 0
    readonly_fields = ("customer", "saved_at")


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ("title", "code", "dealer", "discount_type", "status", "start_date", "end_date")
    list_filter = ("status", "discount_type", "dealer")
    search_fields = ("title", "code")
    inlines = [PromotionTargetInline, PromotionUsageInline, CustomerSavedVoucherInline]


@admin.register(CustomerSavedVoucher)
class CustomerSavedVoucherAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "promotion", "saved_at")
    search_fields = ("customer__user__username", "customer__user__full_name", "promotion__code")
    list_filter = ("saved_at",)

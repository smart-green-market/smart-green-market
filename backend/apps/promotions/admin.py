from django.contrib import admin

from .models import Promotion, PromotionTarget, PromotionUsage


class PromotionTargetInline(admin.TabularInline):
    model = PromotionTarget
    extra = 0


class PromotionUsageInline(admin.TabularInline):
    model = PromotionUsage
    extra = 0
    readonly_fields = ("order", "discount_amount", "created_at")


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ("title", "code", "dealer", "discount_type", "status", "start_date", "end_date")
    list_filter = ("status", "discount_type", "dealer")
    search_fields = ("title", "code")
    inlines = [PromotionTargetInline, PromotionUsageInline]

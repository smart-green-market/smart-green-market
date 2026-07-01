from django.contrib import admin

from .models import ProductMaster, Season


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "start_month", "end_month", "status", "sort_order")
    list_filter = ("status",)
    search_fields = ("name", "code")
    ordering = ("sort_order", "name")


@admin.register(ProductMaster)
class ProductMasterAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "default_unit", "status", "sort_order")
    list_filter = ("status", "category", "seasons")
    search_fields = ("name", "slug")
    filter_horizontal = ("seasons",)

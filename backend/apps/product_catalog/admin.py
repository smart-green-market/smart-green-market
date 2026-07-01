from django.contrib import admin

from .models import ProductMaster


@admin.register(ProductMaster)
class ProductMasterAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "default_unit", "status", "sort_order")
    list_filter = ("status", "category")
    search_fields = ("name", "slug")

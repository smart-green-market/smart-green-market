from django.contrib import admin

from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("id", "company_name", "tax_code", "phone", "verification_status")
    list_filter = ("verification_status",)
    search_fields = ("company_name", "tax_code", "account__username")

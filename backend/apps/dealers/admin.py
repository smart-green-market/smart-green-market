from django.contrib import admin

from .models import DealerProfile


@admin.register(DealerProfile)
class DealerProfileAdmin(admin.ModelAdmin):
    raw_id_fields = ("account", "verified_by")
    list_display = ("id", "store_name", "account", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("store_name", "account__username", "account__email")

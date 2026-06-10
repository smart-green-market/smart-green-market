from django.contrib import admin

from .models import AccountDocument


@admin.register(AccountDocument)
class AccountDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "account", "document_type", "status", "created_at")
    list_filter = ("status", "document_type")
    search_fields = ("account__username", "account__email")

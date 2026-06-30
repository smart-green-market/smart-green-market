from django.contrib import admin

from .models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderPayment,
    PurchaseOrderReturn,
    PurchaseOrderReturnItem,
    PurchaseOrderStatusHistory,
)


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


class PurchaseOrderPaymentInline(admin.TabularInline):
    model = PurchaseOrderPayment
    extra = 0


class PurchaseOrderReturnItemInline(admin.TabularInline):
    model = PurchaseOrderReturnItem
    extra = 0


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("order_code", "supplier", "dealer", "status", "total_amount", "created_at")
    list_filter = ("status",)
    search_fields = ("order_code", "dealer__store_name", "supplier__company_name")
    inlines = [PurchaseOrderItemInline, PurchaseOrderPaymentInline]


@admin.register(PurchaseOrderStatusHistory)
class PurchaseOrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("purchase_order", "old_status", "new_status", "changed_by", "created_at")


@admin.register(PurchaseOrderReturn)
class PurchaseOrderReturnAdmin(admin.ModelAdmin):
    list_display = (
        "purchase_order",
        "status",
        "refund_amount",
        "requested_by",
        "reviewed_by",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("purchase_order__order_code", "reason", "review_note")
    inlines = [PurchaseOrderReturnItemInline]

from django.contrib import admin

from .models import (
    CustomerPayment,
    Order,
    OrderItem,
    OrderReturn,
    OrderReturnItem,
    OrderStatusHistory,
)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class CustomerPaymentInline(admin.TabularInline):
    model = CustomerPayment
    extra = 0


class OrderReturnItemInline(admin.TabularInline):
    model = OrderReturnItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_code",
        "dealer",
        "customer",
        "status",
        "total_amount",
        "paid_amount",
        "created_at",
    )
    list_filter = ("status", "dealer")
    search_fields = ("order_code", "receiver_name", "receiver_phone")
    inlines = [OrderItemInline, CustomerPaymentInline]


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("order", "old_status", "new_status", "changed_by", "created_at")


@admin.register(OrderReturn)
class OrderReturnAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "status",
        "refund_amount",
        "requested_by",
        "reviewed_by",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("order__order_code", "reason", "review_note")
    inlines = [OrderReturnItemInline]

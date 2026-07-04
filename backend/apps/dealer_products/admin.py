from django.contrib import admin

from .models import (
    DealerInventoryBatch,
    DealerInventoryTransaction,
    DealerInventoryWastage,
    DealerProduct,
    DealerProductImage,
    DealerProductRelatedRecommendation,
)


class DealerProductImageInline(admin.TabularInline):
    model = DealerProductImage
    extra = 0


@admin.register(DealerProduct)
class DealerProductAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "dealer_profile", "retail_price", "status")
    list_filter = ("status",)
    search_fields = ("title", "dealer_profile__store_name")
    inlines = [DealerProductImageInline]


@admin.register(DealerInventoryBatch)
class DealerInventoryBatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "batch_number",
        "dealer_product",
        "quantity",
        "remaining_quantity",
        "status",
    )
    list_filter = ("status",)


@admin.register(DealerInventoryWastage)
class DealerInventoryWastageAdmin(admin.ModelAdmin):
    list_display = ("id", "batch", "quantity", "reason", "created_by", "created_at")


@admin.register(DealerProductRelatedRecommendation)
class DealerProductRelatedRecommendationAdmin(admin.ModelAdmin):
    list_display = ("id", "dealer_product", "related_count", "updated_at")
    search_fields = ("dealer_product__title", "dealer_product__dealer_profile__store_name")
    readonly_fields = ("updated_at",)

    @admin.display(description="Số SP gợi ý")
    def related_count(self, obj):
        return len(obj.related_product_ids or [])


@admin.register(DealerInventoryTransaction)
class DealerInventoryTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "batch",
        "type",
        "quantity_change",
        "quantity_after",
        "created_at",
    )
    list_filter = ("type",)

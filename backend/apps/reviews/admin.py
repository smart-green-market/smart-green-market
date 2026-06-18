from django.contrib import admin

from .models import ProductRecommendation, ProductReview, ReviewImage


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("dealer_product", "customer_profile", "rating", "order", "created_at")
    list_filter = ("dealer", "rating")
    search_fields = ("dealer_product__title", "comment")
    inlines = [ReviewImageInline]


@admin.register(ProductRecommendation)
class ProductRecommendationAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "dealer_product",
        "recommendation_type",
        "score",
        "expires_at",
    )
    list_filter = ("recommendation_type", "dealer")

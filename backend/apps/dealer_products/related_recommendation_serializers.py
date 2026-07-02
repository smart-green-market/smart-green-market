"""Serializer gợi ý sản phẩm liên quan — dealer quản lý."""

from rest_framework import serializers

from .models import DealerProductRelatedRecommendation


class DealerProductRelatedRecommendationSerializer(serializers.ModelSerializer):
    dealer_product_id = serializers.IntegerField(source="dealer_product.id", read_only=True)
    dealer_product_title = serializers.CharField(source="dealer_product.title", read_only=True)

    class Meta:
        model = DealerProductRelatedRecommendation
        fields = [
            "id",
            "dealer_product_id",
            "dealer_product_title",
            "related_product_ids",
            "updated_at",
        ]
        read_only_fields = fields

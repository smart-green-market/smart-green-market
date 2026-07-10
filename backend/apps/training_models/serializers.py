from rest_framework import serializers
from .models import ProductPredictionResult

class ProductPredictionResultSerializer(serializers.ModelSerializer):
    # Định dạng lại tỷ lệ phần trăm hiển thị cho UI đỡ phải tự tính
    growth_rate_percentage = serializers.SerializerMethodField()
    confidence_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ProductPredictionResult
        fields = [
            'dealer_product_id', 'product_name', 'category', 
            'recent_avg_daily_sales', 'growth_rate', 'growth_rate_percentage',
            'trend_label', 'forecast_next_days', 'stock_days_left', 
            'days_to_nearest_expiry', 'decision', 'decision_confidence', 
            'confidence_percentage', 'all_probabilities', 'updated_at'
        ]

    def get_growth_rate_percentage(self, obj):
        return f"{obj.growth_rate * 100:+.1f}%"

    def get_confidence_percentage(self, obj):
        return f"{obj.decision_confidence * 100:.1f}%"
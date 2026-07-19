from rest_framework import serializers
from .models import ProductPredictionResult, AITrainingHistory

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


class AITrainingHistorySerializer(serializers.ModelSerializer):
    """Serializer cho lịch sử huấn luyện AI — dùng cho Dashboard Admin."""

    class Meta:
        model = AITrainingHistory
        fields = [
            'id', 'model_name', 'run_date', 'epochs_run', 'final_loss',
            'catalog_coverage', 'total_items_trained', 'status',
            'loss_history', 'dealer_coverage_detail',
        ]


class AITrainingHistorySummarySerializer(serializers.ModelSerializer):
    has_warnings = serializers.SerializerMethodField()

    class Meta:
        model = AITrainingHistory
        fields = [
            'id', 'model_name', 'run_date', 'epochs_run', 'final_loss',
            'catalog_coverage', 'total_items_trained', 'status',
            'has_warnings', 'dealer_coverage_detail',
        ]

    def get_has_warnings(self, obj):
        """True nếu có bất kỳ dealer nào coverage < 100%."""
        if not obj.dealer_coverage_detail:
            return False
        return any(
            d.get('coverage_pct', 100) < 100
            for d in obj.dealer_coverage_detail
        )
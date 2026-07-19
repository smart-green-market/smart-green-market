from django.db import models
from django.utils import timezone

class ProductPredictionResult(models.Model):
    """
    Model lưu trữ kết quả Dự đoán xu thế và Gợi ý quyết định kinh doanh từ AI
    """
    dealer_id = models.IntegerField(db_index=True)
    dealer_product_id = models.IntegerField(db_index=True)
    product_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    
    # Kết quả từ Model Xu thế (LSTM)
    recent_avg_daily_sales = models.FloatField(default=0.0)
    growth_rate = models.FloatField(default=0.0)
    trend_label = models.CharField(max_length=50)  # tang_manh, tang_nhe, on_dinh, giam_nhe, giam_manh
    forecast_next_days = models.JSONField(default=list)  # Mảng lưu số lượng dự đoán 7 ngày tới
    
    # Đặc trưng kho hàng tại thời điểm chạy AI
    stock_days_left = models.FloatField(default=0.0)
    days_to_nearest_expiry = models.IntegerField(default=30)
    
    # Kết quả từ Model Quyết định (Dense Classifier)
    decision = models.CharField(max_length=100)  # Nhập hàng gấp, Nhập thêm hàng, Duy trì...
    decision_confidence = models.FloatField(default=0.0) # Độ tự tin của AI (%)
    all_probabilities = models.JSONField(default=dict) # Xác suất của tất cả các quyết định
    
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'dealer_product_prediction_results'
        unique_together = ('dealer_id', 'dealer_product_id')

    def __str__(self):
        return f"{self.product_name} - {self.decision} ({self.decision_confidence * 100:.1f}%)"
    
class AITrainingHistory(models.Model):
    model_name = models.CharField(max_length=50, default="Item2Vec", verbose_name="Thuật toán áp dụng")
    run_date = models.DateTimeField(default=timezone.now, verbose_name="Thời gian chạy")
    epochs_run = models.IntegerField(help_text="Số chu kỳ học (vòng lặp) để AI nắm bắt dữ liệu", verbose_name="Chu kỳ học")
    final_loss = models.FloatField(help_text="Độ sai lệch (càng thấp càng tốt)", verbose_name="Chỉ số sai lệch (Loss)")
    catalog_coverage = models.FloatField(help_text="Tỷ lệ % sản phẩm hệ thống có đủ dữ liệu để hỗ trợ gợi ý", verbose_name="Tỷ lệ bao phủ sản phẩm")
    total_items_trained = models.IntegerField(help_text="Số lượng sản phẩm đủ điều kiện tham gia phân tích", verbose_name="Tổng sản phẩm phân tích")
    status = models.CharField(max_length=20, default="SUCCESS", verbose_name="Trạng thái")
    loss_history = models.JSONField(
        default=list,
        help_text="Dữ liệu biểu diễn mức độ cải thiện của AI qua từng chu kỳ học",
        verbose_name="Biểu đồ học hỏi"
    )
    dealer_coverage_detail = models.JSONField(
        default=list,
        help_text="Chi tiết khả năng AI hỗ trợ từng cửa hàng (Tỷ lệ sản phẩm được AI ưu tiên gợi ý)",
        verbose_name="Chi tiết hiệu quả theo Cửa hàng"
    )
    
    class Meta:
        db_table = 'ai_training_history'
        ordering = ['-run_date']
        verbose_name = "Lịch sử Hệ thống Phân tích Gợi ý"
        verbose_name_plural = "Lịch sử Hệ thống Phân tích Gợi ý"
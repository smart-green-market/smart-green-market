from .customer_segmentation import CustomerSegmentationService
from .related_product_recommendation import RelatedProductRecommendationService
from .trend_and_decision_service import TrendAndDecisionRecommendationService
# Sau này nếu có thêm model mới, bạn cũng dùng dấu chấm (.) tương tự:
# from .churn_prediction import ChurnPredictionService
# from .product_recommender import ProductRecommenderService

# Quản lý tập trung danh sách export ra ngoài hệ thống Django
__all__ = [
    'CustomerSegmentationService',
    'RelatedProductRecommendationService',
    'TrendAndDecisionRecommendationService',
]
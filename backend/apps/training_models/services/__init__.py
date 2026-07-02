from .customer_segmentation import CustomerSegmentationService

# Sau này nếu có thêm model mới, bạn cũng dùng dấu chấm (.) tương tự:
# from .churn_prediction import ChurnPredictionService
# from .product_recommender import ProductRecommenderService

# Quản lý tập trung danh sách export ra ngoài hệ thống Django
__all__ = [
    'CustomerSegmentationService',
    # 'ChurnPredictionService',       
    # 'ProductRecommenderService',    
]
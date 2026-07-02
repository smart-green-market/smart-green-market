from django.shortcuts import render
from django.http import HttpResponse
from apps.training_models.services import customer_segmentation
from apps.training_models.services import related_product_recommendation

# Create your views here.
def index(request):
    df_labeled, label_mapping = customer_segmentation.CustomerSegmentationService().execute_pipeline(dealer_id=10, t_days=30)
    print(f"Label Mapping: {label_mapping}")
    print(f"Clustered DataFrame:\n{df_labeled.head(20)}")
    print(f"mapping: {label_mapping}")
    return HttpResponse(f"Customer Metrics:")

def train_related_products(request):
    service = related_product_recommendation.RelatedProductRecommendationService()
    success, message = service.execute_pipeline()
    if success:
        return HttpResponse(f"Success: {message}")
    else:
        return HttpResponse(f"Error: {message}")
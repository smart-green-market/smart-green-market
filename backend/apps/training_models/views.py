from django.shortcuts import render
from django.http import HttpResponse
from apps.training_models.services import customer_segmentation

# Create your views here.
def index(request):
    df_labeled, label_mapping = customer_segmentation.CustomerSegmentationService().execute_pipeline(dealer_id=10, t_days=30)
    print(f"Label Mapping: {label_mapping}")
    print(f"Clustered DataFrame:\n{df_labeled.head(20)}")
    print(f"mapping: {label_mapping}")
    return HttpResponse(f"Customer Metrics:")
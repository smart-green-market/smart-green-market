from django.urls import path

from . import views

urlpatterns = [
    path("",views.index,name="index"),
    path("train-related-products/", views.train_related_products, name="train_related_products"),
    path("customer-segmentation/", views.customer_segmentation, name="customer_segmentation",),
    path("dealer/train/", views.dealer_train_model, name="dealer_train_model"),
    path("dealer/analyze/", views.dealer_analyze_data, name="dealer_analyze_data"),
    path("dealer/recommendations/", views.dealer_recommendations, name="dealer_recommendations"),
]
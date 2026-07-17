from django.urls import path

from . import views

urlpatterns = [
    path("",views.index,name="index"),

    path("customer-segmentation/", views.customer_segmentation, name="customer_segmentation",),
    path("dealer/segmentation-history/", views.dealer_segmentation_history, name="dealer_segmentation_history"),
    path("admin/segmentation-history/", views.admin_segmentation_history, name="admin_segmentation_history"),

    path("train-related-products/", views.train_related_products, name="train_related_products"),
    path("sync-related-products/", views.sync_related_products, name="sync_related_products"),


    path("dealer/train/", views.dealer_train_model, name="dealer_train_model"),
    path("dealer/analyze/", views.dealer_analyze_data, name="dealer_analyze_data"),
    path("dealer/recommendations/", views.dealer_recommendations, name="dealer_recommendations"),
]
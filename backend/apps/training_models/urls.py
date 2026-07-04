from django.urls import path

from . import views

urlpatterns = [
    path("",views.index,name="index"),
    path("train-related-products", views.train_related_products, name="train_related_products"),
    path("customer-segmentation/", views.customer_segmentation, name="customer_segmentation",),
]
from django.urls import path

from common.bank_views import BankListView
from common.customer_order_config_views import CustomerOrderConfigView
from common.purchase_order_config_views import PurchaseOrderConfigView
from common.system_config_views import SystemConfigView

urlpatterns = [
    path("banks/", BankListView.as_view()),
    path("purchase-order-config/", PurchaseOrderConfigView.as_view()),
    path("customer-order-config/", CustomerOrderConfigView.as_view()),
    path("system-config/", SystemConfigView.as_view()),
]

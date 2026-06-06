from django.urls import path

from common.system_config_views import SystemConfigView

urlpatterns = [
    path("system-config/", SystemConfigView.as_view()),
]

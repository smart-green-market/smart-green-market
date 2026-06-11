"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    # Swagger  (1 nơi duy nhất cho toàn bộ API)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Business APIs



    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.categories.urls")),
    path("api/", include("apps.suppliers.urls")),
    path("api/", include("apps.dealers.urls")),
    path("api/", include("apps.supplier_products.urls")),
    path("api/", include("apps.dealer_products.urls")),
    path("api/", include("apps.purchase_orders.urls")),
    path("api/", include("apps.certifications.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("common.urls")),
    path("api/", include("apps.supplier_inventory.urls")),


]

# DEBUG=True: django.contrib.staticfiles phục vụ media.
# DEBUG=False (Render): static() không thêm route → phải serve thủ công.
# Lưu ý: disk Render free là tạm — file mất khi redeploy/restart.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        path(
            f"{settings.MEDIA_URL.lstrip('/')}/<path:path>",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]
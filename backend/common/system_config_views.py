"""API endpoint xem cấu hình hệ thống (chỉ admin)."""

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from common.business_rules import get_public_config
from common.openapi import SystemConfigResponseSerializer
from common.permission import IsAdmin


class SystemConfigView(APIView):
    """GET các giới hạn nghiệp vụ công khai — chỉ admin được truy cập."""

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["System Config"],
        summary="Xem cấu hình hệ thống",
        description=(
            "Admin xem các giới hạn nghiệp vụ hiện tại:\n"
            "- Dung lượng upload ảnh (<5MB)\n"
            "- Số danh mục / sản phẩm / ảnh tối đa\n"
            "- Định dạng ảnh cho phép\n"
            "- Số lần đăng nhập sai tối đa\n"
            "- Phiếu nhập: `min_order_amount`, `max_order_amount`, "
            "`min_deposit_percent`, `max_deposit_percent`, "
            "`min_delivery_lead_days`, `default_deposit_percent`\n\n"
            "Dealer/NCC đọc giới hạn phiếu nhập công khai: `GET /api/purchase-order-config/`"
        ),
        responses={200: SystemConfigResponseSerializer},
    )
    def get(self, request):
        """Trả dict cấu hình upload, giới hạn số lượng và cài đặt đăng nhập."""
        return Response(get_public_config())

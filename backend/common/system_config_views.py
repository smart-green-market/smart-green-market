"""API cấu hình hệ thống — admin xem và chỉnh sửa."""

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.system_config.serializers import SystemSettingsUpdateSerializer
from apps.system_config.services import get_system_settings
from common.business_rules import get_public_config
from common.openapi import SystemConfigResponseSerializer, SystemConfigUpdateSerializer
from common.permission import IsAdmin


class SystemConfigView(APIView):
    """GET/PATCH cấu hình nghiệp vụ — chỉ admin."""

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["System Config"],
        summary="Xem cấu hình hệ thống",
        description=(
            "Admin xem các giới hạn nghiệp vụ hiện tại (upload, danh mục, "
            "sản phẩm, đăng nhập, phiếu nhập, đơn buyer).\n\n"
            "Dealer/NCC đọc giới hạn phiếu nhập công khai: "
            "`GET /api/purchase-order-config/`"
        ),
        responses={200: SystemConfigResponseSerializer},
    )
    def get(self, request):
        return Response(get_public_config())

    @extend_schema(
        tags=["System Config"],
        summary="Cập nhật cấu hình hệ thống",
        description=(
            "Admin chỉnh một phần hoặc toàn bộ tham số nghiệp vụ. "
            "Thay đổi có hiệu lực sau khi cache hết hạn (tối đa ~5 phút) "
            "hoặc ngay sau request tiếp theo trên cùng worker.\n\n"
            "**Không thể sửa** `allowed_image_types` (cố định trong code)."
        ),
        request=SystemConfigUpdateSerializer,
        responses={200: SystemConfigResponseSerializer},
    )
    def patch(self, request):
        settings_obj = get_system_settings()
        serializer = SystemSettingsUpdateSerializer(
            settings_obj,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(get_public_config())

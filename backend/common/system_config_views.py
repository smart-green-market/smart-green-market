from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from common.business_rules import get_public_config
from common.permission import IsAdmin


class SystemConfigView(APIView):
    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["System Config"],
        summary="Xem cấu hình hệ thống",
        description=(
            "Admin xem các giới hạn nghiệp vụ hiện tại:\n"
            "- Dung lượng upload ảnh (<5MB)\n"
            "- Số danh mục / sản phẩm / ảnh tối đa\n"
            "- Định dạng ảnh cho phép\n"
            "- Số lần đăng nhập sai tối đa"
        ),
    )
    def get(self, request):
        return Response(get_public_config())

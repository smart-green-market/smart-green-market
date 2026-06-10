"""API danh sách ngân hàng VietQR cho UI select."""

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.banks import get_vietqr_banks

class BankItemSerializer(serializers.Serializer):
    code = serializers.CharField(help_text="Mã ngắn, vd. VCB")
    name = serializers.CharField(help_text="Tên hiển thị, vd. Vietcombank")
    bin = serializers.CharField(help_text="Mã BIN Napas 6 số")
    full_name = serializers.CharField(help_text="Tên đầy đủ tiếng Việt")


class BankListView(APIView):
    """
  Danh sách ngân hàng hỗ trợ VietQR.
  UI dùng select → gửi `bank_bin` + `bank_name` (= item.name) khi lưu hồ sơ NCC.
  """

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Banks"],
        summary="Danh sách ngân hàng (VietQR)",
        description=(
            "Trả danh sách ngân hàng Napas dùng cho dropdown cấu hình TK NCC.\n\n"
            "Khi lưu supplier profile, gửi:\n"
            "- `bank_bin` = item.bin\n"
            "- `bank_name` = item.name\n\n"
            "Không cần auth — có thể gọi trước khi đăng nhập (form đăng ký NCC)."
        ),
        responses={
            200: inline_serializer(
                name="VietQRBankListResponse",
                fields={
                    "count": serializers.IntegerField(
                        help_text="Số ngân hàng trả về (sau lọc search nếu có)",
                    ),
                    "results": BankItemSerializer(many=True),
                },
            )
        },
    )
    def get(self, request):
        banks = get_vietqr_banks()
        search = (request.query_params.get("search") or "").strip().lower()
        if search:
            banks = [
                b
                for b in banks
                if search in b["name"].lower()
                or search in b["code"].lower()
                or search in b["bin"]
                or search in b["full_name"].lower()
            ]
        return Response({"count": len(banks), "results": banks})

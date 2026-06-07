"""Schema helpers dùng chung cho Swagger (drf-spectacular)."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from .openapi_enums import schema_choice_field

PAGINATION_QUERY_HELP = (
    "\n\n**Phân trang (load more):** `?page=1&page_size=20` "
    "(mặc định page=1, page_size=20, tối đa 100)."
)


def paginated_response_schema(item_serializer, name="PaginatedList"):
    return inline_serializer(
        name=name,
        fields={
            "count": serializers.IntegerField(help_text="Tổng số bản ghi"),
            "next": serializers.URLField(
                allow_null=True,
                help_text="URL trang tiếp theo (dùng cho load more)",
            ),
            "previous": serializers.URLField(
                allow_null=True,
                help_text="URL trang trước",
            ),
            "page": serializers.IntegerField(help_text="Trang hiện tại (bắt đầu từ 1)"),
            "page_size": serializers.IntegerField(help_text="Số bản ghi mỗi trang"),
            "has_more": serializers.BooleanField(
                help_text="true nếu còn dữ liệu để tải thêm",
            ),
            "results": item_serializer(many=True),
        },
    )


class MessageResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Thông báo kết quả")
    detail = serializers.CharField(required=False, help_text="Chi tiết (nếu có)")


class RegisterResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Thông báo đăng ký thành công")
    account_id = serializers.IntegerField(help_text="ID tài khoản vừa tạo")
    access = serializers.CharField(help_text="JWT access token — dùng cho bước 2 onboarding (Bearer)")
    refresh = serializers.CharField(help_text="JWT refresh token — dùng gia hạn access token")


class TokenPairResponseSerializer(serializers.Serializer):
    access = serializers.CharField(help_text="JWT access token (thời hạn 30 phút)")
    refresh = serializers.CharField(help_text="JWT refresh token (thời hạn 7 ngày)")


class TokenRefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Refresh token nhận được khi đăng ký/đăng nhập")


class TokenVerifyRequestSerializer(serializers.Serializer):
    token = serializers.CharField(help_text="Access hoặc refresh token cần kiểm tra")


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Tên đăng nhập")
    password = serializers.CharField(help_text="Mật khẩu", style={"input_type": "password"})


class VerifySupplierSerializer(serializers.Serializer):
    verification_status = schema_choice_field(
        choices=["pending", "approved", "rejected"],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Lý do từ chối / yêu cầu bổ sung hồ sơ",
    )


class SupplierAccountStatusSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=["active", "inactive", "banned"],
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Ghi chú lý do thay đổi trạng thái",
    )


class MyNotificationItemSerializer(serializers.Serializer):
    receipt_id = serializers.IntegerField(help_text="ID bản ghi nhận thông báo")
    id = serializers.IntegerField(help_text="ID thông báo")
    title = serializers.CharField(help_text="Tiêu đề")
    content = serializers.CharField(help_text="Nội dung chi tiết")
    type = schema_choice_field(
        choices=["info", "warning", "success", "error"],
    )
    type_label = serializers.CharField(help_text="Tên loại thông báo (tiếng Việt)")
    reference_type = serializers.CharField(
        allow_null=True,
        help_text="Mã nhóm đối tượng liên quan",
    )
    reference_type_label = serializers.CharField(
        help_text="Tên nhóm đối tượng (tiếng Việt)",
    )
    reference_id = serializers.IntegerField(
        allow_null=True,
        help_text="ID đối tượng liên quan",
    )
    read_at = serializers.DateTimeField(
        allow_null=True,
        help_text="Thời điểm đọc (null = chưa đọc)",
    )
    created_at = serializers.DateTimeField(help_text="Thời gian tạo thông báo")


class MarkReadResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    notification_id = serializers.IntegerField()
    updated = serializers.IntegerField(help_text="Số bản ghi được cập nhật")


AvatarUploadForm = inline_serializer(
    name="AvatarUploadForm",
    fields={
        "avatar": serializers.FileField(
            help_text="Ảnh đại diện (jpg, png, webp — tối đa 5MB)",
        ),
    },
)

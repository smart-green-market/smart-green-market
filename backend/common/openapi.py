"""Schema helpers dùng chung cho Swagger (drf-spectacular)."""

from rest_framework import serializers


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
    verification_status = serializers.ChoiceField(
        choices=["pending", "approved", "rejected"],
        help_text="Trạng thái duyệt nhà cung cấp (chỉ Admin)",
    )


class MyNotificationItemSerializer(serializers.Serializer):
    receipt_id = serializers.IntegerField(help_text="ID bản ghi nhận thông báo")
    id = serializers.IntegerField(help_text="ID thông báo")
    title = serializers.CharField()
    content = serializers.CharField()
    type = serializers.ChoiceField(choices=["info", "warning", "success", "error"])
    reference_type = serializers.CharField(allow_null=True, help_text="Loại đối tượng liên quan")
    reference_id = serializers.IntegerField(allow_null=True, help_text="ID đối tượng liên quan")
    read_at = serializers.DateTimeField(allow_null=True, help_text="Thời điểm đọc (null = chưa đọc)")
    created_at = serializers.DateTimeField()


class MarkReadResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    notification_id = serializers.IntegerField()
    updated = serializers.IntegerField(help_text="Số bản ghi được cập nhật")

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.validators import validate_image_upload
from .login_guard import check_login_allowed, record_failed_login, reset_login_attempts
from .models import AccountRole, AccountStatus

Account = get_user_model()


def build_avatar_url(account, request=None):
    if not account.avatar:
        return None
    url = account.avatar.url
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "Tài khoản hoặc mật khẩu không chính xác.",
    }

    def validate(self, attrs):
        username = attrs.get("username")
        check_login_allowed(username)
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            record_failed_login(username)
            raise
        reset_login_attempts(username)

        user = self.user
        if user.status == AccountStatus.BANNED:
            raise ValidationError("Tài khoản đã bị vô hiệu hóa.")
        if user.status == AccountStatus.INACTIVE:
            raise ValidationError("Tài khoản đang bị tạm khóa.")
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        help_text="Mật khẩu (tối thiểu theo validator Django)",
    )
    repassword = serializers.CharField(
        write_only=True,
        help_text="Nhập lại mật khẩu — phải khớp với password",
    )
    role = serializers.ChoiceField(
        choices=AccountRole.choices,
        help_text="Vai trò: buyer | supplier | dealer. Supplier/dealer → status=pending",
    )

    class Meta:
        model = Account
        fields = [
            "username",
            "email",
            "password",
            "repassword",
            "first_name",
            "last_name",
            "phone",
            "role",
        ]
        extra_kwargs = {
            "username": {"help_text": "Tên đăng nhập (unique)"},
            "email": {"help_text": "Email (unique)"},
            "first_name": {"help_text": "Tên"},
            "last_name": {"help_text": "Họ"},
            "phone": {"help_text": "Số điện thoại"},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["repassword"]:
            raise serializers.ValidationError({
                "repassword": "Mật khẩu xác nhận không khớp."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop("repassword")
        password = validated_data.pop("password")
        account = Account(**validated_data)
        account.set_password(password)
        if account.role == AccountRole.BUYER:
            account.status = AccountStatus.ACTIVE
        elif account.role in [AccountRole.SUPPLIER, AccountRole.DEALER]:
            account.status = AccountStatus.PENDING
        account.save()
        return account


class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Account
        exclude = [
            "password",
            "groups",
            "user_permissions",
            "avatar",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        return build_avatar_url(obj, self.context.get("request"))


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.FileField(
        help_text="Ảnh đại diện (jpg, png, webp — tối đa 5MB)",
    )

    def validate_avatar(self, file):
        validate_image_upload(file)
        return file


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(help_text="Mật khẩu hiện tại")
    new_password = serializers.CharField(help_text="Mật khẩu mới")


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Refresh token cần blacklist khi đăng xuất")

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.avatar import build_avatar_url
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierLoginProfileSerializer
from .login_guard import check_login_allowed, record_failed_login, reset_login_attempts
from .models import AccountRole, AccountStatus

Account = get_user_model()


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

        request = self.context.get("request")
        data["account"] = LoginAccountSerializer(user, context={"request": request}).data

        supplier = (
            Supplier.objects.filter(account=user)
            .prefetch_related("documents__verified_by")
            .select_related("verified_by")
            .first()
        )
        data["supplier_profile"] = (
            SupplierLoginProfileSerializer(
                supplier,
                context={"request": request},
            ).data
            if supplier
            else None
        )
        return data


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(max_length=255, help_text="Họ và tên")
    password = serializers.CharField(
        write_only=True,
        help_text="Mật khẩu (tối thiểu theo validator Django)",
    )
    repassword = serializers.CharField(
        write_only=True,
        help_text="Nhập lại mật khẩu — phải khớp với password",
    )
    role = schema_choice_field(choices=AccountRole.choices)

    class Meta:
        model = Account
        fields = [
            "username",
            "email",
            "password",
            "repassword",
            "full_name",
            "phone",
            "role",
        ]
        extra_kwargs = {
            "username": {"help_text": "Tên đăng nhập (unique)"},
            "email": {"help_text": "Email (unique)"},
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


class LoginAccountSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản tối giản — dùng trong response login."""

    avatar_url = serializers.SerializerMethodField()
    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    status = schema_choice_field(choices=AccountStatus.choices, read_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "avatar_url",
            "role",
            "status",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        return build_avatar_url(obj, self.context.get("request"))


class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    status = schema_choice_field(choices=AccountStatus.choices, read_only=True)

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


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField(help_text="JWT access token (thời hạn 30 phút)")
    refresh = serializers.CharField(help_text="JWT refresh token (thời hạn 7 ngày)")
    account = LoginAccountSerializer(help_text="Thông tin tài khoản đăng nhập")
    supplier_profile = SupplierLoginProfileSerializer(
        allow_null=True,
        required=False,
        help_text="Hồ sơ nhà cung cấp + giấy tờ (null nếu không phải supplier hoặc chưa tạo hồ sơ)",
    )


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

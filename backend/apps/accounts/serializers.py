from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import AccountStatus,AccountRole
Account = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    default_error_messages = {
        "no_active_account": "Tài khoản hoặc mật khẩu không chính xác."
    }
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

        elif account.role in [
            AccountRole.SUPPLIER,
            AccountRole.DEALER
        ]:
            account.status = AccountStatus.PENDING
        account.save()

        return account


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        exclude = [
            "password",
            "groups",
            "user_permissions",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(help_text="Mật khẩu hiện tại")
    new_password = serializers.CharField(help_text="Mật khẩu mới")


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Refresh token cần blacklist khi đăng xuất")
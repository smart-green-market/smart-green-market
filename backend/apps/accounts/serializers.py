"""Serializer xử lý dữ liệu tài khoản, đăng ký và xác thực JWT."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.avatar import build_avatar_url
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload
from apps.dealers.models import DealerProfile
from apps.dealers.serializers import DealerLoginProfileSerializer
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierLoginProfileSerializer
from .login_guard import check_login_allowed, record_failed_login, reset_login_attempts
from .models import AccountRole, AccountStatus

Account = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer đăng nhập JWT, kiểm tra khóa tài khoản và đính kèm thông tin user."""

    default_error_messages = {
        "no_active_account": "Tài khoản hoặc mật khẩu không chính xác.",
    }

    def validate(self, attrs):
        """Xác thực đăng nhập, kiểm tra trạng thái tài khoản và bổ sung dữ liệu response."""
        username = attrs.get("username")
        check_login_allowed(username)
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            record_failed_login(username)
            raise
        reset_login_attempts(username)

        user = self.user
        if user.role == AccountRole.BUYER and user.store_dealer_id is not None:
            raise ValidationError(
                "Buyer gian hàng đại lý vui lòng đăng nhập qua "
                "POST /api/storefronts/{dealer_slug}/login/."
            )
        if user.status == AccountStatus.BANNED:
            raise ValidationError("Tài khoản đã bị vô hiệu hóa.")
        if user.status == AccountStatus.INACTIVE:
            raise ValidationError("Tài khoản đang bị tạm khóa.")

        request = self.context.get("request")
        data["account"] = LoginAccountSerializer(user, context={"request": request}).data

        supplier = (
            Supplier.objects.filter(account=user)
            .select_related("account", "verified_by")
            .prefetch_related(
                "account__documents__verified_by",
            )
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
        dealer = (
            DealerProfile.objects.filter(account=user)
            .select_related("account", "verified_by")
            .prefetch_related("account__documents__verified_by")
            .first()
        )
        data["dealer_profile"] = (
            DealerLoginProfileSerializer(
                dealer,
                context={"request": request},
            ).data
            if dealer
            else None
        )
        if user.role == AccountRole.BUYER and user.store_dealer_id is None:
            from apps.customers.models import CustomerProfile
            from apps.customers.serializers import CustomerProfileSerializer

            customer = (
                CustomerProfile.objects.filter(user=user)
                .select_related("user", "user__store_dealer", "favorite_category")
                .first()
            )
            data["customer_profile"] = (
                CustomerProfileSerializer(
                    customer,
                    context={"request": request},
                ).data
                if customer
                else None
            )
        else:
            data["customer_profile"] = None
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer đăng ký tài khoản mới với xác nhận mật khẩu và gán trạng thái theo vai trò."""

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
        """Cấu hình trường dữ liệu cho serializer đăng ký."""

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
        """Kiểm tra mật khẩu và mật khẩu xác nhận phải trùng nhau."""
        if attrs["password"] != attrs["repassword"]:
            raise serializers.ValidationError({
                "repassword": "Mật khẩu xác nhận không khớp."
            })
        if attrs.get("role") == AccountRole.BUYER:
            raise serializers.ValidationError({
                "role": (
                    "Buyer đăng ký qua gian hàng đại lý: "
                    "POST /api/storefronts/{dealer_slug}/register/"
                ),
            })
        if attrs.get("role") in (
            AccountRole.ADMIN,
            AccountRole.SUPPLIER,
            AccountRole.DEALER,
        ):
            email = attrs.get("email", "").strip()
            if Account.objects.filter(
                email__iexact=email,
                role__in=(
                    AccountRole.ADMIN,
                    AccountRole.SUPPLIER,
                    AccountRole.DEALER,
                ),
            ).exists():
                raise serializers.ValidationError({"email": "Email đã được sử dụng."})
        return attrs

    def create(self, validated_data):
        """Tạo tài khoản mới, hash mật khẩu và gán trạng thái theo vai trò."""
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
        """Cấu hình các trường trả về khi đăng nhập."""

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
            "store_dealer_id",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID tài khoản"},
            "username": {"help_text": "Tên đăng nhập"},
            "email": {"help_text": "Email"},
            "full_name": {"help_text": "Họ và tên"},
            "phone": {"help_text": "Số điện thoại"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        """Tạo URL đầy đủ cho ảnh đại diện của tài khoản."""
        return build_avatar_url(obj, self.context.get("request"))


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer đọc và cập nhật thông tin profile cá nhân."""

    avatar_url = serializers.SerializerMethodField()
    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    status = schema_choice_field(choices=AccountStatus.choices, read_only=True)

    class Meta:
        """Cấu hình trường profile, loại trừ dữ liệu nhạy cảm và quan hệ Django auth."""

        model = Account
        exclude = [
            "password",
            "groups",
            "user_permissions",
            "avatar",
        ]
        extra_kwargs = {
            "username": {"help_text": "Tên đăng nhập (read-only sau đăng ký)"},
            "email": {"help_text": "Email liên hệ"},
            "first_name": {"help_text": "Tên (tùy chọn)"},
            "last_name": {"help_text": "Họ (tùy chọn)"},
            "full_name": {"help_text": "Họ và tên hiển thị"},
            "phone": {"help_text": "Số điện thoại"},
            "created_at": {"help_text": "Thời điểm tạo tài khoản"},
            "updated_at": {"help_text": "Thời điểm cập nhật gần nhất"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        """Tạo URL đầy đủ cho ảnh đại diện trong profile."""
        return build_avatar_url(obj, self.context.get("request"))


class LoginResponseSerializer(serializers.Serializer):
    """Cấu trúc response trả về sau khi đăng nhập thành công."""

    access = serializers.CharField(help_text="JWT access token (thời hạn 2 giờ)")
    refresh = serializers.CharField(help_text="JWT refresh token (thời hạn 7 ngày)")
    account = LoginAccountSerializer(help_text="Thông tin tài khoản đăng nhập")
    supplier_profile = SupplierLoginProfileSerializer(
        allow_null=True,
        required=False,
        help_text="Hồ sơ nhà cung cấp + giấy tờ (null nếu không phải supplier hoặc chưa tạo hồ sơ)",
    )
    dealer_profile = DealerLoginProfileSerializer(
        allow_null=True,
        required=False,
        help_text="Hồ sơ đại lý + giấy tờ (null nếu không phải dealer hoặc chưa tạo hồ sơ)",
    )
    customer_profile = serializers.DictField(
        allow_null=True,
        required=False,
        help_text="Hồ sơ buyer (null nếu không phải buyer hoặc chưa tạo hồ sơ)",
    )


class AvatarUploadSerializer(serializers.Serializer):
    """Serializer nhận file ảnh đại diện khi upload."""

    avatar = serializers.FileField(
        help_text="Ảnh đại diện (jpg, png, webp — tối đa 5MB)",
    )

    def validate_avatar(self, file):
        """Kiểm tra định dạng và kích thước file ảnh đại diện."""
        validate_image_upload(file)
        return file


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer nhận mật khẩu cũ và mật khẩu mới khi đổi mật khẩu."""

    old_password = serializers.CharField(help_text="Mật khẩu hiện tại")
    new_password = serializers.CharField(help_text="Mật khẩu mới")


class LogoutSerializer(serializers.Serializer):
    """Serializer nhận refresh token cần blacklist khi đăng xuất."""

    refresh = serializers.CharField(help_text="Refresh token cần blacklist khi đăng xuất")

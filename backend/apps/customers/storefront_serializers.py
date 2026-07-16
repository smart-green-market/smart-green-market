"""Serializer đăng ký / đăng nhập buyer trên gian hàng đại lý."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError

from apps.accounts.login_guard import check_login_allowed, record_failed_login, reset_login_attempts
from apps.accounts.models import AccountRole, AccountStatus
from apps.accounts.serializers import LoginAccountSerializer
from apps.dealers.models import DealerProfile
from apps.marketing.segment_defaults import resolve_primary_segment_membership
from apps.marketing.serializers import CustomerProfileSegmentSerializer
from apps.loyalty.serializers import LoyaltyTierSummarySerializer, serialize_loyalty_status
from common.openapi_enums import schema_choice_field

from .models import CustomerProfile
from .serializers import CustomerProfileSerializer, StorefrontCustomerProfileSerializer
from .services import (
    build_storefront_username,
    customer_profile_detail_queryset,
    get_active_dealer_by_slug,
    storefront_buyer_exists,
)
from .tokens import StorefrontRefreshToken

Account = get_user_model()


class StorefrontRegisterSerializer(serializers.Serializer):
    """Đăng ký buyer tại một gian hàng đại lý."""

    email = serializers.EmailField(help_text="Email — unique trong phạm vi đại lý")
    password = serializers.CharField(write_only=True, help_text="Mật khẩu")
    repassword = serializers.CharField(write_only=True, help_text="Nhập lại mật khẩu")
    full_name = serializers.CharField(max_length=255, help_text="Họ và tên")
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if attrs["password"] != attrs["repassword"]:
            raise serializers.ValidationError({"repassword": "Mật khẩu xác nhận không khớp."})
        dealer_slug = self.context["dealer_slug"]
        try:
            dealer = get_active_dealer_by_slug(dealer_slug)
        except DealerProfile.DoesNotExist as exc:
            raise serializers.ValidationError({"detail": "Gian hàng không tồn tại hoặc chưa hoạt động."}) from exc
        email = attrs["email"].strip()
        if storefront_buyer_exists(dealer, email):
            raise serializers.ValidationError({"email": "Email đã đăng ký tại cửa hàng này."})
        attrs["dealer"] = dealer
        attrs["email"] = email
        return attrs

    def create(self, validated_data):
        dealer = validated_data["dealer"]
        email = validated_data["email"]
        account = Account(
            username=build_storefront_username(dealer.id, email),
            email=email,
            full_name=validated_data["full_name"],
            phone=validated_data.get("phone", ""),
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=dealer,
        )
        account.set_password(validated_data["password"])
        account.save()
        CustomerProfile.objects.create(user=account)
        return account


class StorefrontLoginSerializer(serializers.Serializer):
    """Đăng nhập buyer theo email + password trong phạm vi một đại lý."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        dealer_slug = self.context["dealer_slug"]
        try:
            dealer = get_active_dealer_by_slug(dealer_slug)
        except DealerProfile.DoesNotExist as exc:
            raise serializers.ValidationError({"detail": "Gian hàng không tồn tại hoặc chưa hoạt động."}) from exc

        email = attrs["email"].strip()
        try:
            account = Account.objects.select_related("store_dealer", "customer_profile").get(
                role=AccountRole.BUYER,
                store_dealer=dealer,
                email__iexact=email,
            )
        except Account.DoesNotExist as exc:
            raise AuthenticationFailed("Email hoặc mật khẩu không chính xác.") from exc

        check_login_allowed(account.username)
        if not account.check_password(attrs["password"]):
            record_failed_login(account.username)
            raise AuthenticationFailed("Email hoặc mật khẩu không chính xác.")
        reset_login_attempts(account.username)

        if account.status == AccountStatus.BANNED:
            raise ValidationError("Tài khoản đã bị vô hiệu hóa.")
        if account.status == AccountStatus.INACTIVE:
            raise ValidationError("Tài khoản đang bị tạm khóa.")

        attrs["account"] = account
        attrs["dealer"] = dealer
        return attrs

    def create(self, validated_data):
        return validated_data["account"]


class StorefrontAuthResponseSerializer(serializers.Serializer):
    """Response JWT sau đăng ký / đăng nhập storefront."""

    access = serializers.CharField(help_text="JWT access token")
    refresh = serializers.CharField(help_text="JWT refresh token")
    account = LoginAccountSerializer(help_text="Thông tin tài khoản buyer")
    customer_profile = CustomerProfileSerializer(help_text="Hồ sơ khách hàng tại đại lý (không lộ phân khúc nội bộ)")
    store_dealer = serializers.DictField(help_text="Thông tin gian hàng đại lý")


def build_storefront_auth_response(account, request):
    """Tạo payload JWT + thông tin buyer/dealer cho response."""
    refresh = StorefrontRefreshToken.for_user(account)
    dealer = account.store_dealer
    profile, _ = CustomerProfile.objects.get_or_create(user=account)
    customer_profile = customer_profile_detail_queryset().get(pk=profile.pk)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "account": LoginAccountSerializer(account, context={"request": request}).data,
        "customer_profile": StorefrontCustomerProfileSerializer(
            customer_profile,
            context={"request": request},
        ).data,
        "store_dealer": {
            "id": dealer.id,
            "store_name": dealer.store_name,
            "slug": dealer.slug,
        },
    }


class DealerCustomerListSerializer(serializers.ModelSerializer):
    """Khách hàng trong tệp của đại lý — dùng cho dealer/admin."""

    account = LoginAccountSerializer(source="user", read_only=True)
    dealer_name = serializers.CharField(
        source="user.store_dealer.store_name",
        read_only=True,
    )
    dealer_slug = serializers.SlugField(
        source="user.store_dealer.slug",
        read_only=True,
    )
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    status = schema_choice_field(
        source="user.status",
        choices=AccountStatus.choices,
        read_only=True,
    )
    segments = serializers.SerializerMethodField()
    primary_segment = serializers.SerializerMethodField()
    current_tier = LoyaltyTierSummarySerializer(read_only=True)
    loyalty = serializers.SerializerMethodField()

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "account",
            "dealer_name",
            "dealer_slug",
            "email",
            "full_name",
            "phone",
            "status",
            "favorite_category",
            "total_orders",
            "total_spent",
            "loyalty_points",
            "current_tier",
            "loyalty",
            "last_order_at",
            "note",
            "segments",
            "primary_segment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "account",
            "dealer_name",
            "dealer_slug",
            "email",
            "full_name",
            "phone",
            "status",
            "total_orders",
            "total_spent",
            "loyalty_points",
            "current_tier",
            "loyalty",
            "last_order_at",
            "segments",
            "primary_segment",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.DictField())
    def get_loyalty(self, obj):
        return serialize_loyalty_status(obj)

    @extend_schema_field(CustomerProfileSegmentSerializer(many=True))
    def get_segments(self, obj):
        memberships = obj.segment_memberships.all()
        return CustomerProfileSegmentSerializer(
            memberships,
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(CustomerProfileSegmentSerializer(allow_null=True))
    def get_primary_segment(self, obj):
        memberships = list(obj.segment_memberships.all())
        primary = resolve_primary_segment_membership(memberships)
        if primary is None:
            return None
        return CustomerProfileSegmentSerializer(primary, context=self.context).data


class DealerCustomerNoteSerializer(serializers.ModelSerializer):
    """Đại lý cập nhật ghi chú khách hàng."""

    class Meta:
        model = CustomerProfile
        fields = ["note"]

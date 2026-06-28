"""Serializer hồ sơ đại lý."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.document_serializers import AccountDocumentReadSerializer
from apps.accounts.models import AccountRole, AccountStatus
from apps.dealer_products.serializers import DealerProductReadSerializer
from common.avatar import build_avatar_url
from common.files import build_media_url
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload

from .models import DealerProfile, DealerProfileStatus

Account = get_user_model()


class DealerAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản gắn với đại lý."""

    avatar_url = serializers.SerializerMethodField()
    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    status = schema_choice_field(choices=AccountStatus.choices, read_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "avatar_url",
            "role",
            "status",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "username": {"help_text": "Tên đăng nhập"},
            "email": {"help_text": "Email"},
            "full_name": {"help_text": "Họ và tên"},
            "phone": {"help_text": "Số điện thoại"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        return build_avatar_url(obj, self.context.get("request"))


class DealerProfileSerializer(serializers.ModelSerializer):
    """Serializer tạo và cập nhật hồ sơ đại lý."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    status = schema_choice_field(choices=DealerProfileStatus.choices, read_only=True)

    class Meta:
        model = DealerProfile
        fields = "__all__"
        read_only_fields = [
            "account",
            "slug",
            "logo_url",
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "store_name": {"help_text": "Tên cửa hàng / đại lý"},
            "slug": {
                "help_text": "Mã cửa hàng công khai (xxx-yyy-zzz) — tự sinh, read-only",
            },
            "store_address": {"help_text": "Địa chỉ cửa hàng"},
            "logo": {"help_text": "Logo cửa hàng đại lý (JPG/PNG/WebP)", "required": False},
            "logo_url": {"help_text": "URL đầy đủ của logo", "read_only": True},
            "description": {"help_text": "Giới thiệu ngắn", "required": False},
            "status": {"help_text": "pending | active | inactive | rejected"},
            "verified_by": {"help_text": "ID admin duyệt"},
            "verified_at": {"help_text": "Thời điểm duyệt/từ chối"},
            "rejection_reason": {"help_text": "Lý do từ chối (nếu rejected)"},
            "account": {"help_text": "ID tài khoản (tự gán khi tạo)"},
        }

    def validate(self, attrs):
        logo = attrs.get("logo")
        if logo:
            validate_image_upload(logo)
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        if DealerProfile.objects.filter(account=user).exists():
            raise serializers.ValidationError(
                {"detail": "Tài khoản này đã đăng ký đại lý."}
            )
        validated_data["account"] = user
        return super().create(validated_data)

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class DealerProfileListSerializer(serializers.ModelSerializer):
    """Đại lý kèm tài khoản — danh sách chờ duyệt."""

    account = DealerAccountNestedSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField(read_only=True)
    status = schema_choice_field(choices=DealerProfileStatus.choices, read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
        help_text="Username admin duyệt",
    )

    class Meta:
        model = DealerProfile
        fields = [
            "id",
            "account",
            "store_name",
            "slug",
            "store_address",
            "logo",
            "logo_url",
            "description",
            "status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = DealerProfileSerializer.Meta.extra_kwargs | {
            "id": {"help_text": "ID hồ sơ đại lý"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class DealerLoginProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ đại lý kèm giấy tờ — response login."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    documents = AccountDocumentReadSerializer(
        source="account.documents",
        many=True,
        read_only=True,
    )
    status = schema_choice_field(choices=DealerProfileStatus.choices, read_only=True)

    class Meta:
        model = DealerProfile
        fields = [
            "id",
            "store_name",
            "slug",
            "store_address",
            "logo",
            "logo_url",
            "description",
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
            "documents",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class DealerProfileDetailSerializer(serializers.ModelSerializer):
    """Chi tiết đại lý kèm account, giấy tờ và sản phẩm."""

    account = DealerAccountNestedSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField(read_only=True)
    documents = AccountDocumentReadSerializer(
        source="account.documents",
        many=True,
        read_only=True,
    )
    products = DealerProductReadSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=DealerProfileStatus.choices, read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = DealerProfile
        fields = [
            "id",
            "account",
            "store_name",
            "slug",
            "store_address",
            "logo",
            "logo_url",
            "description",
            "status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
            "documents",
            "products",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class DealerStorefrontLinkSerializer(serializers.Serializer):
    """Thông tin link gian hàng công khai của đại lý."""

    dealer_id = serializers.IntegerField(help_text="ID hồ sơ đại lý")
    store_name = serializers.CharField(help_text="Tên cửa hàng / đại lý")
    slug = serializers.SlugField(help_text="Mã cửa hàng công khai (xxx-yyy-zzz)")
    status = serializers.CharField(help_text="Trạng thái hồ sơ đại lý")
    storefront_path = serializers.CharField(help_text="Path frontend của gian hàng")
    storefront_url = serializers.URLField(help_text="URL đầy đủ để đại lý chia sẻ")
    can_share = serializers.BooleanField(
        help_text="true nếu gian hàng đã active và có thể gửi cho buyer"
    )

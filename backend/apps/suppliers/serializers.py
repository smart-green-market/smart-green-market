"""Serializer xử lý dữ liệu nhà cung cấp."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.document_serializers import AccountDocumentReadSerializer
from apps.accounts.models import AccountRole, AccountStatus
from apps.certifications.serializers import CertificationReadSerializer
from apps.certifications.serializers import CertificationCatalogSerializer
from apps.dealers.models import DealerProfile
from apps.supplier_products.serializer import SupplierProductReadSerializer
from common.approval_nested import ApprovalSupplierNestedSerializer
from common.avatar import build_avatar_url
from common.files import build_media_url
from common.banks import BANKS_BY_BIN, get_bank_by_bin
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload

from .models import Supplier, SupplierVerificationStatus

Account = get_user_model()


class SupplierAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản gắn với supplier."""

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

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        return build_avatar_url(obj, self.context.get("request"))


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer tạo và cập nhật hồ sơ nhà cung cấp."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    verification_status = schema_choice_field(
        choices=SupplierVerificationStatus.choices,
        read_only=True,
    )

    class Meta:
        model = Supplier
        fields = "__all__"
        read_only_fields = [
            "account",
            "logo_url",
            "verification_status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "company_name": {"help_text": "Tên công ty / trang trại"},
            "tax_code": {"help_text": "Mã số thuế (unique toàn hệ thống)"},
            "phone": {"help_text": "Hotline liên hệ công ty"},
            "address": {"help_text": "Địa chỉ trụ sở / kho hàng"},
            "description": {"help_text": "Giới thiệu ngắn về nhà cung cấp", "required": False},
            "logo": {
                "help_text": "Logo nhà cung cấp (JPG/PNG/WebP)",
                "required": False,
            },
            "logo_url": {"help_text": "URL đầy đủ của logo", "read_only": True},
            "bank_name": {
                "help_text": "Tên ngân hàng — lấy từ GET /api/banks/ (field name)",
                "required": False,
            },
            "bank_bin": {
                "help_text": "Mã BIN Napas 6 số — lấy từ GET /api/banks/ (field bin)",
                "required": False,
            },
            "account_number": {"help_text": "Số tài khoản ngân hàng", "required": False},
            "account_name": {
                "help_text": "Tên chủ tài khoản (không dấu, viết hoa — dùng VietQR)",
                "required": False,
            },
            "verification_status": {"help_text": "pending | approved | rejected"},
            "verified_by": {"help_text": "ID admin duyệt hồ sơ"},
            "verified_at": {"help_text": "Thời điểm duyệt/từ chối"},
            "rejection_reason": {"help_text": "Lý do từ chối hồ sơ (nếu rejected)"},
            "account": {"help_text": "ID tài khoản gắn với NCC (tự gán khi tạo)"},
            "created_at": {"help_text": "Thời điểm tạo hồ sơ"},
            "updated_at": {"help_text": "Thời điểm cập nhật gần nhất"},
        }

    def validate(self, attrs):
        logo = attrs.get("logo")
        if logo:
            validate_image_upload(logo)
        bank_bin = attrs.get("bank_bin") or getattr(self.instance, "bank_bin", "")
        bank_name = attrs.get("bank_name") or getattr(self.instance, "bank_name", "")
        if bank_bin and bank_bin not in BANKS_BY_BIN:
            raise serializers.ValidationError(
                {"bank_bin": "Mã BIN không hợp lệ. Chọn từ GET /api/banks/."}
            )
        if bank_bin:
            bank = get_bank_by_bin(bank_bin)
            if bank_name and bank_name != bank["name"]:
                raise serializers.ValidationError(
                    {"bank_name": f"bank_name phải khớp BIN: {bank['name']}."}
                )
            attrs["bank_name"] = bank["name"]
        return attrs

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        if Supplier.objects.filter(account=user).exists():
            raise serializers.ValidationError(
                {"detail": "Tài khoản này đã đăng ký nhà cung cấp."}
            )
        validated_data["account"] = request.user
        return super().create(validated_data)


class SupplierContactSerializer(serializers.ModelSerializer):
    """Người liên hệ đại diện NCC — từ tài khoản gắn hồ sơ."""

    avatar_url = serializers.SerializerMethodField(
        help_text="Ảnh đại diện người liên hệ",
    )

    class Meta:
        model = Account
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "avatar_url",
        ]
        extra_kwargs = {
            "full_name": {"help_text": "Họ tên người liên hệ"},
            "email": {"help_text": "Email liên hệ"},
            "phone": {"help_text": "SĐT người liên hệ"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        return build_avatar_url(obj, self.context.get("request"))


class SupplierCatalogSerializer(serializers.ModelSerializer):
    """NCC catalog cho đại lý — không trả thông tin tài khoản ngân hàng."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    active_product_count = serializers.IntegerField(
        read_only=True,
        help_text="Số sản phẩm đang active của NCC",
    )

    class Meta:
        model = Supplier
        fields = [
            "id",
            "company_name",
            "tax_code",
            "phone",
            "address",
            "logo_url",
            "description",
            "active_product_count",
            "created_at",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID hồ sơ NCC — dùng khi tạo phiếu nhập"},
            "company_name": {"help_text": "Tên công ty / trang trại"},
            "tax_code": {"help_text": "Mã số thuế"},
            "phone": {"help_text": "Hotline liên hệ"},
            "address": {"help_text": "Địa chỉ trụ sở / kho"},
            "description": {
                "help_text": "Giới thiệu / quy mô hoạt động (NCC tự mô tả)",
            },
            "created_at": {"help_text": "Thời điểm NCC tham gia hệ thống"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class SupplierCatalogDetailSerializer(SupplierCatalogSerializer):
    """Chi tiết NCC cho dealer — liên hệ, chứng nhận, chỉ số quy mô (không có SP/tk ngân hàng)."""

    contact = SupplierContactSerializer(
        source="account",
        read_only=True,
        help_text="Người liên hệ: họ tên, email, SĐT",
    )
    certifications = CertificationCatalogSerializer(
        many=True,
        read_only=True,
        help_text="Chứng nhận đã duyệt (VietGAP, hữu cơ...)",
    )
    approved_certification_count = serializers.IntegerField(
        read_only=True,
        help_text="Số chứng nhận đã duyệt",
    )
    total_daily_production_capacity = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
        allow_null=True,
        help_text="Tổng năng lực sản xuất TB/ngày (cộng SP active, cùng đơn vị từng SP)",
    )

    class Meta(SupplierCatalogSerializer.Meta):
        fields = SupplierCatalogSerializer.Meta.fields + [
            "contact",
            "certifications",
            "approved_certification_count",
            "total_daily_production_capacity",
        ]


class SupplierListSerializer(serializers.ModelSerializer):
    """Nhà cung cấp kèm tài khoản — dùng cho danh sách chờ duyệt."""

    account = SupplierAccountNestedSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField(read_only=True)
    verification_status = schema_choice_field(
        choices=SupplierVerificationStatus.choices,
        read_only=True,
    )
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Supplier
        fields = [
            "id",
            "account",
            "company_name",
            "tax_code",
            "phone",
            "address",
            "logo",
            "logo_url",
            "description",
            "bank_name",
            "bank_bin",
            "account_number",
            "account_name",
            "verification_status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = SupplierSerializer.Meta.extra_kwargs | {
            "id": {"help_text": "ID hồ sơ NCC"},
            "account": {"help_text": "Thông tin tài khoản gắn với NCC"},
            "verified_by_username": {"help_text": "Username admin duyệt"},
        }

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class SupplierLoginProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ NCC kèm giấy tờ — dùng trong response login."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    documents = AccountDocumentReadSerializer(
        source="account.documents",
        many=True,
        read_only=True,
    )
    verification_status = schema_choice_field(
        choices=SupplierVerificationStatus.choices,
        read_only=True,
    )

    class Meta:
        model = Supplier
        fields = [
            "id",
            "company_name",
            "tax_code",
            "phone",
            "address",
            "logo",
            "logo_url",
            "description",
            "bank_name",
            "bank_bin",
            "account_number",
            "account_name",
            "verification_status",
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


class SupplierDetailSerializer(serializers.ModelSerializer):
    """Chi tiết supplier kèm account, giấy tờ, chứng nhận và sản phẩm."""

    account = SupplierAccountNestedSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField(read_only=True)
    documents = AccountDocumentReadSerializer(
        source="account.documents",
        many=True,
        read_only=True,
    )
    certifications = CertificationReadSerializer(many=True, read_only=True)
    products = SupplierProductReadSerializer(many=True, read_only=True)
    verification_status = schema_choice_field(
        choices=SupplierVerificationStatus.choices,
        read_only=True,
    )

    class Meta:
        model = Supplier
        fields = [
            "id",
            "account",
            "company_name",
            "tax_code",
            "phone",
            "address",
            "logo",
            "logo_url",
            "description",
            "bank_name",
            "bank_bin",
            "account_number",
            "account_name",
            "verification_status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
            "documents",
            "certifications",
            "products",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))


class SupplierPurchasingDealerContactSerializer(serializers.Serializer):
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    avatar_url = serializers.URLField(read_only=True, allow_null=True)


class SupplierPurchasingDealerSerializer(serializers.ModelSerializer):
    """Đại lý đã từng đặt phiếu nhập từ NCC — kèm thống kê đơn hàng."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    contact = serializers.SerializerMethodField(read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    completed_order_count = serializers.IntegerField(read_only=True)
    last_order_at = serializers.DateTimeField(read_only=True, allow_null=True)
    total_purchase_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = DealerProfile
        fields = [
            "id",
            "store_name",
            "slug",
            "store_address",
            "logo_url",
            "status",
            "contact",
            "order_count",
            "completed_order_count",
            "last_order_at",
            "total_purchase_amount",
            "created_at",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))

    @extend_schema_field(SupplierPurchasingDealerContactSerializer)
    def get_contact(self, obj):
        account = obj.account
        return SupplierPurchasingDealerContactSerializer(
            {
                "full_name": account.full_name,
                "phone": account.phone or "",
                "email": account.email,
                "avatar_url": build_avatar_url(account, self.context.get("request")),
            }
        ).data

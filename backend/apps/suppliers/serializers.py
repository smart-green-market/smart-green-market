"""Serializer xử lý dữ liệu nhà cung cấp."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.document_serializers import AccountDocumentReadSerializer
from apps.accounts.models import AccountRole, AccountStatus
from apps.certifications.serializers import CertificationReadSerializer
from apps.supplier_products.serializer import SupplierProductReadSerializer
from common.approval_nested import ApprovalSupplierNestedSerializer
from common.avatar import build_avatar_url
from common.banks import BANKS_BY_BIN, get_bank_by_bin
from common.openapi_enums import schema_choice_field

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

    verification_status = schema_choice_field(
        choices=SupplierVerificationStatus.choices,
        read_only=True,
    )

    class Meta:
        model = Supplier
        fields = "__all__"
        read_only_fields = [
            "account",
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

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        if Supplier.objects.filter(account=user).exists():
            raise serializers.ValidationError(
                {"detail": "Tài khoản này đã đăng ký nhà cung cấp."}
            )
        validated_data["account"] = request.user
        return super().create(validated_data)


class SupplierListSerializer(serializers.ModelSerializer):
    """Nhà cung cấp kèm tài khoản — dùng cho danh sách chờ duyệt."""

    account = SupplierAccountNestedSerializer(read_only=True)
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


class SupplierLoginProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ NCC kèm giấy tờ — dùng trong response login."""

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


class SupplierDetailSerializer(serializers.ModelSerializer):
    """Chi tiết supplier kèm account, giấy tờ, chứng nhận và sản phẩm."""

    account = SupplierAccountNestedSerializer(read_only=True)
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

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from common.approval_nested import ApprovalSupplierNestedSerializer
from common.avatar import build_avatar_url
from common.files import build_media_url
from common.openapi_enums import schema_choice_field
from apps.certifications.serializers import CertificationReadSerializer
from apps.supplier_products.serializer import SupplierProductReadSerializer
from .models import Supplier, SupplierDocument, SupplierDocumentType, SupplierDocumentStatus, SupplierVerificationStatus
from apps.accounts.models import AccountRole, AccountStatus

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


class SupplierDocumentReadSerializer(serializers.ModelSerializer):
    """Giấy tờ — dùng khi đọc/nested (trả URL file đầy đủ)."""

    file_url = serializers.SerializerMethodField()
    document_type = schema_choice_field(
        choices=SupplierDocumentType.choices,
        read_only=True,
    )
    document_type_label = serializers.SerializerMethodField()
    status = schema_choice_field(
        choices=SupplierDocumentStatus.choices,
        read_only=True,
    )
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = SupplierDocument
        fields = [
            "id",
            "document_type",
            "document_type_label",
            "file_url",
            "status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "created_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_document_type_label(self, obj):
        return dict(SupplierDocumentType.choices).get(
            obj.document_type,
            obj.document_type,
        )

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_file_url(self, obj):
        return build_media_url(obj.file_url, self.context.get("request"))


class SupplierDocumentListSerializer(SupplierDocumentReadSerializer):
    """Giấy tờ kèm thông tin nhà cung cấp — dùng cho danh sách / chi tiết doc."""

    supplier = ApprovalSupplierNestedSerializer(read_only=True)

    class Meta(SupplierDocumentReadSerializer.Meta):
        fields = SupplierDocumentReadSerializer.Meta.fields + ["supplier"]


class SupplierSerializer(serializers.ModelSerializer):
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
        }

    def create(self, validated_data):
        request = self.context["request"]
        user = self.context["request"].user

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
            "verification_status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]


class SupplierLoginProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ NCC kèm giấy tờ — dùng trong response login."""

    documents = SupplierDocumentReadSerializer(many=True, read_only=True)
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
    documents = SupplierDocumentReadSerializer(many=True, read_only=True)
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


class SupplierDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(help_text="File giấy tờ (PDF, JPG, PNG...)")
    document_type = schema_choice_field(choices=SupplierDocumentType.choices)
    status = schema_choice_field(
        choices=SupplierDocumentStatus.choices,
        read_only=True,
    )

    class Meta:
        model = SupplierDocument
        fields = "__all__"
        read_only_fields = [
            "supplier",
            "status",
            "verified_by",
            "verified_at",
            "created_at",
        ]
        extra_kwargs = {
            "file_url": {"help_text": "File giấy tờ (PDF, JPG, PNG...)"},
        }

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["supplier"] = request.user.supplier_profile
        return super().create(validated_data)


class SupplierDocumentBulkUploadSerializer(serializers.Serializer):
    """Upload đồng thời 3 loại giấy tờ trong một request multipart."""

    business_license = serializers.FileField(
        help_text="Giấy phép kinh doanh (PDF, JPG, PNG)",
    )
    id_card = serializers.FileField(
        help_text="CMND/CCCD (PDF, JPG, PNG)",
    )
    tax_certificate = serializers.FileField(
        help_text="Giấy chứng nhận thuế (PDF, JPG, PNG)",
    )

    def validate(self, attrs):
        user = self.context["request"].user
        if not hasattr(user, "supplier_profile"):
            raise serializers.ValidationError(
                {"detail": "Bạn cần tạo hồ sơ supplier trước khi upload giấy tờ."}
            )
        return attrs

    def create(self, validated_data):
        supplier = self.context["request"].user.supplier_profile
        documents = []
        for document_type, file in validated_data.items():
            document, _created = SupplierDocument.objects.update_or_create(
                supplier=supplier,
                document_type=document_type,
                defaults={
                    "file_url": file,
                    "status": SupplierDocumentStatus.PENDING,
                    "verified_by": None,
                    "verified_at": None,
                },
            )
            documents.append(document)
        return documents


class VerifySupplierDocumentSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=[
            SupplierDocumentStatus.APPROVED,
            SupplierDocumentStatus.REJECTED,
        ],
    )
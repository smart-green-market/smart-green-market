"""Serializer xử lý giấy tờ xác minh tài khoản (supplier/dealer)."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from common.approval_nested import ApprovalAccountNestedSerializer
from common.files import build_media_url
from common.openapi_enums import schema_choice_field
from common.validators import require_rejection_reason

from .models import AccountDocument, AccountDocumentStatus, AccountDocumentType, AccountRole


class AccountDocumentReadSerializer(serializers.ModelSerializer):
    """Giấy tờ — dùng khi đọc/nested (trả URL file đầy đủ)."""

    file_url = serializers.SerializerMethodField()
    document_type = schema_choice_field(
        choices=AccountDocumentType.choices,
        read_only=True,
    )
    document_type_label = serializers.SerializerMethodField()
    status = schema_choice_field(
        choices=AccountDocumentStatus.choices,
        read_only=True,
    )
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = AccountDocument
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
        extra_kwargs = {
            "id": {"help_text": "ID giấy tờ"},
            "verified_by": {"help_text": "ID admin duyệt"},
            "verified_at": {"help_text": "Thời điểm duyệt/từ chối"},
            "created_at": {"help_text": "Thời điểm upload"},
        }

    @extend_schema_field(serializers.CharField())
    def get_document_type_label(self, obj):
        return dict(AccountDocumentType.choices).get(
            obj.document_type,
            obj.document_type,
        )

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_file_url(self, obj):
        return build_media_url(obj.file_url, self.context.get("request"))


class AccountDocumentListSerializer(AccountDocumentReadSerializer):
    """Giấy tờ kèm thông tin tài khoản — dùng cho danh sách / chi tiết doc."""

    account = ApprovalAccountNestedSerializer(read_only=True)

    class Meta(AccountDocumentReadSerializer.Meta):
        fields = AccountDocumentReadSerializer.Meta.fields + ["account"]


class AccountDocumentSerializer(serializers.ModelSerializer):
    """Serializer upload hoặc thay thế một giấy tờ đơn lẻ."""

    file_url = serializers.FileField(help_text="File giấy tờ (PDF, JPG, PNG...)")
    document_type = schema_choice_field(choices=AccountDocumentType.choices)
    status = schema_choice_field(
        choices=AccountDocumentStatus.choices,
        read_only=True,
    )

    class Meta:
        model = AccountDocument
        fields = "__all__"
        read_only_fields = [
            "account",
            "status",
            "verified_by",
            "verified_at",
            "created_at",
        ]

    def create(self, validated_data):
        validated_data["account"] = self.context["request"].user
        return super().create(validated_data)


class AccountDocumentBulkUploadSerializer(serializers.Serializer):
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
        if user.role not in (AccountRole.SUPPLIER, AccountRole.DEALER):
            raise serializers.ValidationError(
                {"detail": "Chỉ supplier hoặc dealer mới được upload giấy tờ."}
            )
        return attrs

    def create(self, validated_data):
        account = self.context["request"].user
        documents = []
        for document_type, file in validated_data.items():
            document, _created = AccountDocument.objects.update_or_create(
                account=account,
                document_type=document_type,
                defaults={
                    "file_url": file,
                    "status": AccountDocumentStatus.PENDING,
                    "verified_by": None,
                    "verified_at": None,
                },
            )
            documents.append(document)
        return documents


class VerifyAccountDocumentSerializer(serializers.Serializer):
    """Serializer nhận trạng thái duyệt giấy tờ từ admin."""

    status = schema_choice_field(
        choices=[
            AccountDocumentStatus.APPROVED,
            AccountDocumentStatus.REJECTED,
        ],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Bắt buộc khi status=rejected",
    )

    def validate(self, attrs):
        return require_rejection_reason(
            attrs,
            "status",
            "rejection_reason",
            {AccountDocumentStatus.REJECTED},
        )

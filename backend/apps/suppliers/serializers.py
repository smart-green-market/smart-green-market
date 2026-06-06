from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.serializers import build_avatar_url
from apps.certifications.serializers import CertificationSerializer
from apps.supplier_products.serializer import SupplierProductSerializer
from .models import Supplier, SupplierDocument, SupplierDocumentType, SupplierDocumentStatus

Account = get_user_model()


class SupplierAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản gắn với supplier."""

    avatar_url = serializers.SerializerMethodField()

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
            "file_url",
            "status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "created_at",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_file_url(self, obj):
        if not obj.file_url:
            return None
        request = self.context.get("request")
        url = obj.file_url.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class SupplierSerializer(serializers.ModelSerializer):
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
            "verification_status": {
                "help_text": "pending | approved | rejected (chỉ Admin cập nhật qua verify)",
            },
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


class SupplierDetailSerializer(serializers.ModelSerializer):
    """Chi tiết supplier kèm account, giấy tờ, chứng nhận và sản phẩm."""

    account = SupplierAccountNestedSerializer(read_only=True)
    documents = SupplierDocumentReadSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    products = SupplierProductSerializer(many=True, read_only=True)

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
            "document_type": {
                "help_text": (
                    f"Loại giấy tờ: {', '.join(c[0] for c in SupplierDocumentType.choices)}"
                ),
            },
            "status": {"help_text": "pending | approved | rejected (Admin duyệt)"},
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


class VerifySupplierDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierDocument
        fields = ["status"]
        extra_kwargs = {
            "status": {"help_text": "approved hoặc rejected"},
        }
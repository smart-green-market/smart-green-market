from django.utils import timezone
from rest_framework import serializers

from common.approval_nested import ApprovalSupplierNestedSerializer
from common.business_rules import (
    MAX_IMAGES_PER_CERTIFICATION,
    allowed_image_extensions_label,
)
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload
from .models import (
    Certification,
    CertificationAuditAction,
    CertificationAuditLog,
    CertificationImage,
    CertificationStatus,
)

_IMAGE_FIELD_HELP = (
    f"Ảnh scan chứng nhận ({allowed_image_extensions_label()} — tối đa 5MB/ảnh)"
)


def _collect_upload_files(request):
    return request.FILES.getlist("images")


def _ensure_certification_image_permission(user, certification):
    if not user or not user.is_authenticated:
        return
    if user.role == "admin":
        return
    if user.role in ("supplier", "dealer"):
        profile = getattr(user, "supplier_profile", None)
        if not profile or certification.supplier_id != profile.id:
            raise serializers.ValidationError(
                "Bạn không có quyền thao tác ảnh của chứng nhận này."
            )
        return
    raise serializers.ValidationError(
        "Bạn không có quyền thao tác ảnh của chứng nhận này."
    )


class CertificationImageSerializer(serializers.ModelSerializer):
    image_url = serializers.FileField(
        required=False,
        help_text=_IMAGE_FIELD_HELP,
    )

    class Meta:
        model = CertificationImage
        fields = [
            "id",
            "certification",
            "image_url",
            "sort_order",
            "created_at",
        ]
        read_only_fields = ["created_at"]
        extra_kwargs = {
            "certification": {"help_text": "ID chứng nhận"},
            "sort_order": {"help_text": "Thứ tự hiển thị (số nhỏ hiện trước)"},
        }

    def validate_image_url(self, file):
        if file and hasattr(file, "read"):
            validate_image_upload(file)
        return file

    def validate(self, attrs):
        certification = attrs.get("certification") or getattr(
            self.instance, "certification", None
        )
        if certification and self.instance is None:
            if certification.images.count() >= MAX_IMAGES_PER_CERTIFICATION:
                raise serializers.ValidationError(
                    f"Mỗi chứng nhận tối đa {MAX_IMAGES_PER_CERTIFICATION} ảnh."
                )
        if self.instance is None and not attrs.get("image_url"):
            raise serializers.ValidationError(
                {"image_url": "Vui lòng chọn ảnh để upload."}
            )
        return attrs

    def validate_certification(self, certification):
        _ensure_certification_image_permission(
            self.context.get("request").user
            if self.context.get("request")
            else None,
            certification,
        )
        return certification

    def update(self, instance, validated_data):
        new_file = validated_data.get("image_url")
        if new_file and instance.image_url:
            instance.image_url.delete(save=False)
        return super().update(instance, validated_data)


class CertificationImageBulkUploadSerializer(serializers.Serializer):
    certification = serializers.PrimaryKeyRelatedField(
        queryset=Certification.objects.filter(deleted_at__isnull=True),
        help_text="ID chứng nhận cần gắn ảnh",
    )

    def validate(self, attrs):
        request = self.context["request"]
        certification = attrs["certification"]
        _ensure_certification_image_permission(request.user, certification)

        files = _collect_upload_files(request)
        if not files:
            raise serializers.ValidationError(
                {"images": "Vui lòng chọn ít nhất 1 ảnh (field `images`)."}
            )

        for file in files:
            validate_image_upload(file)

        current_count = certification.images.count()
        if current_count + len(files) > MAX_IMAGES_PER_CERTIFICATION:
            remaining = max(0, MAX_IMAGES_PER_CERTIFICATION - current_count)
            raise serializers.ValidationError(
                {
                    "images": (
                        f"Mỗi chứng nhận tối đa {MAX_IMAGES_PER_CERTIFICATION} ảnh. "
                        f"Còn upload được {remaining} ảnh."
                    )
                }
            )

        attrs["files"] = files
        return attrs

    def create(self, validated_data):
        certification = validated_data["certification"]
        files = validated_data["files"]
        base_sort = (
            certification.images.order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
            or -1
        ) + 1

        created = []
        for index, file in enumerate(files):
            image = CertificationImage.objects.create(
                certification=certification,
                image_url=file,
                sort_order=base_sort + index,
            )
            created.append(image)
        return created


class CertificationAuditLogSerializer(serializers.ModelSerializer):
    action = schema_choice_field(
        choices=CertificationAuditAction.choices,
        read_only=True,
    )
    performed_by_username = serializers.CharField(
        source="performed_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = CertificationAuditLog
        fields = [
            "id",
            "action",
            "performed_by",
            "performed_by_username",
            "note",
            "created_at",
        ]


class CertificationReadSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    status = schema_choice_field(choices=CertificationStatus.choices, read_only=True)
    images = CertificationImageSerializer(many=True, read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )
    revoked_by_username = serializers.CharField(
        source="revoked_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Certification
        fields = [
            "id",
            "name",
            "certificate_code",
            "issued_by",
            "issue_date",
            "expiry_date",
            "description",
            "status",
            "is_expired",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "revoked_by",
            "revoked_by_username",
            "revoked_at",
            "revoke_reason",
            "deleted_at",
            "created_at",
            "updated_at",
            "images",
        ]


class CertificationListSerializer(CertificationReadSerializer):
    """Chứng nhận kèm nhà cung cấp — dùng cho danh sách chờ duyệt."""

    supplier = ApprovalSupplierNestedSerializer(read_only=True)

    class Meta(CertificationReadSerializer.Meta):
        fields = CertificationReadSerializer.Meta.fields + ["supplier"]


class CertificationSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    status = schema_choice_field(choices=CertificationStatus.choices, read_only=True)
    images = CertificationImageSerializer(many=True, read_only=True)

    class Meta:
        model = Certification
        fields = "__all__"
        read_only_fields = [
            "supplier",
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "revoked_by",
            "revoked_at",
            "revoke_reason",
            "deleted_at",
        ]
        extra_kwargs = {
            "name": {"help_text": "Tên chứng nhận (vd: VietGAP, Organic EU)"},
            "certificate_code": {"help_text": "Mã số trên giấy chứng nhận"},
            "issued_by": {"help_text": "Cơ quan cấp"},
            "issue_date": {"help_text": "Ngày cấp (YYYY-MM-DD)"},
            "expiry_date": {"help_text": "Ngày hết hạn (YYYY-MM-DD)"},
            "description": {"help_text": "Ghi chú thêm", "required": False},
        }

    def validate(self, attrs):
        issue_date = attrs.get("issue_date") or getattr(self.instance, "issue_date", None)
        expiry_date = attrs.get("expiry_date") or getattr(self.instance, "expiry_date", None)
        if issue_date and expiry_date and expiry_date <= issue_date:
            raise serializers.ValidationError(
                {"expiry_date": "Ngày hết hạn phải sau ngày cấp."}
            )
        return attrs


class CertificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = [
            "name",
            "certificate_code",
            "issued_by",
            "issue_date",
            "expiry_date",
            "description",
        ]
        extra_kwargs = CertificationSerializer.Meta.extra_kwargs

    def validate(self, attrs):
        issue_date = attrs.get("issue_date")
        expiry_date = attrs.get("expiry_date")
        if issue_date and expiry_date and expiry_date <= issue_date:
            raise serializers.ValidationError(
                {"expiry_date": "Ngày hết hạn phải sau ngày cấp."}
            )
        request = self.context["request"]
        files = _collect_upload_files(request)
        if not files:
            raise serializers.ValidationError(
                {"images": "Vui lòng chọn ít nhất 1 ảnh scan (field `images`)."}
            )
        if len(files) > MAX_IMAGES_PER_CERTIFICATION:
            raise serializers.ValidationError(
                {
                    "images": (
                        f"Mỗi chứng nhận tối đa {MAX_IMAGES_PER_CERTIFICATION} ảnh."
                    )
                }
            )
        for file in files:
            validate_image_upload(file)
        attrs["files"] = files
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        files = validated_data.pop("files")
        profile = getattr(request.user, "supplier_profile", None)
        if not profile:
            raise serializers.ValidationError(
                "Bạn cần có hồ sơ nhà cung cấp trước khi đăng ký chứng nhận."
            )
        validated_data["supplier"] = profile
        certification = Certification.objects.create(**validated_data)
        for index, file in enumerate(files):
            CertificationImage.objects.create(
                certification=certification,
                image_url=file,
                sort_order=index,
            )
        return certification


class VerifyCertificationSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=[CertificationStatus.APPROVED, CertificationStatus.REJECTED],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Lý do từ chối / yêu cầu bổ sung",
    )


class RevokeCertificationSerializer(serializers.Serializer):
    revoke_reason = serializers.CharField(
        help_text="Lý do thu hồi chứng nhận không hợp lệ",
    )


def log_certification_action(certification, action, user, note=""):
    CertificationAuditLog.objects.create(
        certification=certification,
        action=action,
        performed_by=user,
        note=note,
    )


def mark_expired_certifications():
    today = timezone.localdate()
    expired_qs = Certification.objects.filter(
        expiry_date__lt=today,
        status=CertificationStatus.APPROVED,
    )
    for cert in expired_qs:
        cert.status = CertificationStatus.EXPIRED
        cert.save(update_fields=["status", "updated_at"])
        log_certification_action(
            cert,
            CertificationAuditAction.EXPIRED,
            None,
            f"Tự động đánh dấu hết hạn (ngày {cert.expiry_date}).",
        )

from django.utils import timezone
from rest_framework import serializers

from common.validators import validate_image_upload
from .models import (
    Certification,
    CertificationAuditAction,
    CertificationAuditLog,
    CertificationStatus,
)


class CertificationAuditLogSerializer(serializers.ModelSerializer):
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


class CertificationSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    file_url = serializers.FileField(
        required=False,
        help_text="Ảnh scan chứng nhận (jpg, png, webp — tối đa 5MB)",
    )

    class Meta:
        model = Certification
        fields = "__all__"
        read_only_fields = [
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
            "supplier": {"help_text": "ID nhà cung cấp sở hữu chứng nhận"},
            "name": {"help_text": "Tên chứng nhận (vd: VietGAP, Organic EU)"},
            "certificate_code": {"help_text": "Mã số trên giấy chứng nhận"},
            "issued_by": {"help_text": "Cơ quan cấp"},
            "issue_date": {"help_text": "Ngày cấp (YYYY-MM-DD)"},
            "expiry_date": {"help_text": "Ngày hết hạn (YYYY-MM-DD)"},
            "description": {"help_text": "Ghi chú thêm", "required": False},
        }

    def validate_file_url(self, file):
        if file and hasattr(file, "read"):
            validate_image_upload(file)
        return file

    def validate(self, attrs):
        issue_date = attrs.get("issue_date") or getattr(self.instance, "issue_date", None)
        expiry_date = attrs.get("expiry_date") or getattr(self.instance, "expiry_date", None)
        if issue_date and expiry_date and expiry_date <= issue_date:
            raise serializers.ValidationError(
                {"expiry_date": "Ngày hết hạn phải sau ngày cấp."}
            )
        if self.instance is None and not attrs.get("file_url"):
            raise serializers.ValidationError(
                {"file_url": "Vui lòng chọn ảnh scan chứng nhận để upload."}
            )
        return attrs

    def update(self, instance, validated_data):
        new_file = validated_data.get("file_url")
        if new_file and instance.file_url:
            instance.file_url.delete(save=False)
        return super().update(instance, validated_data)


class VerifyCertificationSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[CertificationStatus.APPROVED, CertificationStatus.REJECTED],
        help_text="approved (duyệt) hoặc rejected (từ chối)",
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

from rest_framework import serializers

from .models import Certification
from .models import CertificationStatus


class CertificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Certification
        fields = "__all__"
        read_only_fields = [
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
        ]
        extra_kwargs = {
            "supplier": {"help_text": "ID nhà cung cấp sở hữu chứng nhận"},
            "name": {"help_text": "Tên chứng nhận (vd: VietGAP, Organic EU)"},
            "certificate_code": {"help_text": "Mã số trên giấy chứng nhận"},
            "issued_by": {"help_text": "Cơ quan cấp"},
            "issue_date": {"help_text": "Ngày cấp (YYYY-MM-DD)"},
            "expiry_date": {"help_text": "Ngày hết hạn (YYYY-MM-DD)"},
            "file_url": {"help_text": "URL file scan chứng nhận"},
            "description": {"help_text": "Ghi chú thêm", "required": False},
        }



class VerifyCertificationSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=[
            CertificationStatus.APPROVED,
            CertificationStatus.REJECTED,
        ],
        help_text="approved hoặc rejected",
    )

    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Lý do từ chối (bắt buộc khi rejected)",
    )
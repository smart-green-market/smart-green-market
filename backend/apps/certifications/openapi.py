"""OpenAPI schema cho upload ảnh chứng nhận (Swagger UI hiển thị nút chọn file)."""

from rest_framework import serializers
from drf_spectacular.utils import inline_serializer

from common.business_rules import MAX_IMAGES_PER_CERTIFICATION, allowed_image_extensions_label

_IMAGE_HELP = (
    f"Ảnh scan chứng nhận ({allowed_image_extensions_label()} — tối đa 5MB/ảnh). "
    f"Tối đa {MAX_IMAGES_PER_CERTIFICATION} ảnh/chứng nhận."
)

CertificationCreateForm = inline_serializer(
    name="CertificationCreateForm",
    fields={
        "name": serializers.CharField(help_text="Tên chứng nhận (vd: VietGAP, Organic EU)"),
        "certificate_code": serializers.CharField(help_text="Mã số trên giấy chứng nhận"),
        "issued_by": serializers.CharField(help_text="Cơ quan cấp"),
        "issue_date": serializers.DateField(help_text="Ngày cấp (YYYY-MM-DD)"),
        "expiry_date": serializers.DateField(help_text="Ngày hết hạn (YYYY-MM-DD)"),
        "images": serializers.ListField(
            child=serializers.FileField(),
            help_text="Chọn một hoặc nhiều ảnh scan (field `images`)",
        ),
        "description": serializers.CharField(
            required=False,
            allow_blank=True,
            help_text="Ghi chú thêm",
        ),
    },
)

CertificationUpdateForm = inline_serializer(
    name="CertificationUpdateForm",
    fields={
        "name": serializers.CharField(
            required=False,
            help_text="Tên chứng nhận (vd: VietGAP, Organic EU)",
        ),
        "certificate_code": serializers.CharField(
            required=False,
            help_text="Mã số trên giấy chứng nhận",
        ),
        "issued_by": serializers.CharField(
            required=False,
            help_text="Cơ quan cấp",
        ),
        "issue_date": serializers.DateField(
            required=False,
            help_text="Ngày cấp (YYYY-MM-DD)",
        ),
        "expiry_date": serializers.DateField(
            required=False,
            help_text="Ngày hết hạn (YYYY-MM-DD)",
        ),
        "description": serializers.CharField(
            required=False,
            allow_blank=True,
            help_text="Ghi chú thêm",
        ),
    },
)

CertificationImageBulkUploadForm = inline_serializer(
    name="CertificationImageBulkUploadForm",
    fields={
        "certification": serializers.IntegerField(
            help_text="ID chứng nhận cần gắn ảnh",
        ),
        "images": serializers.ListField(
            child=serializers.FileField(),
            help_text="Chọn một hoặc nhiều ảnh (field `images`)",
        ),
    },
)

CertificationImageReplaceForm = inline_serializer(
    name="CertificationImageReplaceForm",
    fields={
        "image_url": serializers.FileField(help_text=_IMAGE_HELP),
        "sort_order": serializers.IntegerField(
            required=False,
            help_text="Thứ tự hiển thị",
        ),
    },
)

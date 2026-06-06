"""OpenAPI schema cho upload file chứng nhận (Swagger UI hiển thị nút chọn file)."""

from rest_framework import serializers
from drf_spectacular.utils import inline_serializer

CertificationCreateForm = inline_serializer(
    name="CertificationCreateForm",
    fields={
        "supplier": serializers.IntegerField(help_text="ID nhà cung cấp sở hữu chứng nhận"),
        "name": serializers.CharField(help_text="Tên chứng nhận (vd: VietGAP, Organic EU)"),
        "certificate_code": serializers.CharField(help_text="Mã số trên giấy chứng nhận"),
        "issued_by": serializers.CharField(help_text="Cơ quan cấp"),
        "issue_date": serializers.DateField(help_text="Ngày cấp (YYYY-MM-DD)"),
        "expiry_date": serializers.DateField(help_text="Ngày hết hạn (YYYY-MM-DD)"),
        "file_url": serializers.FileField(
            help_text="Ảnh scan chứng nhận (jpg, png, webp — tối đa 5MB)",
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
        "supplier": serializers.IntegerField(required=False),
        "name": serializers.CharField(required=False),
        "certificate_code": serializers.CharField(required=False),
        "issued_by": serializers.CharField(required=False),
        "issue_date": serializers.DateField(required=False),
        "expiry_date": serializers.DateField(required=False),
        "file_url": serializers.FileField(
            required=False,
            help_text="Ảnh scan mới (jpg, png, webp — tối đa 5MB)",
        ),
        "description": serializers.CharField(required=False, allow_blank=True),
    },
)

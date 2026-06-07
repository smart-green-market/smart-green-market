"""OpenAPI schema cho upload file (Swagger UI hiển thị nút chọn file)."""

from rest_framework import serializers
from drf_spectacular.utils import inline_serializer

from common.openapi_enums import schema_choice_field
from apps.suppliers.models import SupplierDocumentType

SupplierDocumentBulkUploadForm = inline_serializer(
    name="SupplierDocumentBulkUploadForm",
    fields={
        "business_license": serializers.FileField(
            help_text="Giấy phép kinh doanh (PDF, JPG, PNG)",
        ),
        "id_card": serializers.FileField(
            help_text="CMND/CCCD (PDF, JPG, PNG)",
        ),
        "tax_certificate": serializers.FileField(
            help_text="Giấy chứng nhận thuế (PDF, JPG, PNG)",
        ),
    },
)

SupplierDocumentReplaceForm = inline_serializer(
    name="SupplierDocumentReplaceForm",
    fields={
        "document_type": schema_choice_field(
            choices=SupplierDocumentType.choices,
            required=False,
        ),
        "file_url": serializers.FileField(
            help_text="File giấy tờ mới (PDF, JPG, PNG)",
        ),
    },
)

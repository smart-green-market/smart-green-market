"""OpenAPI schema cho upload giấy tờ tài khoản."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from common.openapi_enums import schema_choice_field

from .models import AccountDocumentType

AccountDocumentBulkUploadForm = inline_serializer(
    name="AccountDocumentBulkUploadForm",
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

AccountDocumentReplaceForm = inline_serializer(
    name="AccountDocumentReplaceForm",
    fields={
        "document_type": schema_choice_field(
            choices=AccountDocumentType.choices,
            required=False,
        ),
        "file_url": serializers.FileField(
            help_text="File giấy tờ mới (PDF, JPG, PNG)",
        ),
    },
)

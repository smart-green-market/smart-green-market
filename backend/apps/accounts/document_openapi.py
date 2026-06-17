"""OpenAPI schema cho upload giấy tờ tài khoản."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from common.openapi_enums import schema_choice_field
from common.openapi_files import DOCUMENT_FILE_HELP

from .models import AccountDocumentType

AccountDocumentBulkUploadForm = inline_serializer(
    name="AccountDocumentBulkUploadForm",
    fields={
        "business_license": serializers.FileField(
            help_text=DOCUMENT_FILE_HELP,
        ),
        "id_card": serializers.FileField(
            help_text=DOCUMENT_FILE_HELP,
        ),
        "tax_certificate": serializers.FileField(
            help_text=DOCUMENT_FILE_HELP,
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
            help_text=DOCUMENT_FILE_HELP,
        ),
    },
)

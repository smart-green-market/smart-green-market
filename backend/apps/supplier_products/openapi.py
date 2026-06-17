"""OpenAPI schema cho upload ảnh sản phẩm (Swagger UI hiển thị nút chọn file)."""

from rest_framework import serializers
from drf_spectacular.utils import inline_serializer

from common.business_rules import MAX_IMAGES_PER_PRODUCT
from common.openapi_files import IMAGE_FILE_HELP

_IMAGE_HELP = (
    f"{IMAGE_FILE_HELP}. Tối đa {MAX_IMAGES_PER_PRODUCT} ảnh/sản phẩm."
)

SupplierProductImageBulkUploadForm = inline_serializer(
    name="SupplierProductImageBulkUploadForm",
    fields={
        "supplier_product": serializers.IntegerField(
            help_text="ID sản phẩm cần gắn ảnh",
        ),
        "images": serializers.ListField(
            child=serializers.FileField(),
            help_text="Chọn một hoặc nhiều ảnh (field `images`)",
        ),
        "is_thumbnail": serializers.BooleanField(
            required=False,
            default=False,
            help_text="true = ảnh đầu tiên trong batch làm ảnh đại diện",
        ),
    },
)

SupplierProductImageReplaceForm = inline_serializer(
    name="SupplierProductImageReplaceForm",
    fields={
        "image_url": serializers.FileField(
            help_text=_IMAGE_HELP,
        ),
        "is_thumbnail": serializers.BooleanField(
            required=False,
            help_text="true = đặt làm ảnh đại diện",
        ),
        "sort_order": serializers.IntegerField(
            required=False,
            help_text="Thứ tự hiển thị",
        ),
    },
)

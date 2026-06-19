"""OpenAPI schema upload ảnh sản phẩm đại lý (Swagger hiển thị nút chọn file)."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from common.openapi_files import IMAGE_FILE_HELP, MULTIPART_FILE_UPLOAD_NOTE

DEALER_PRODUCT_IMAGE_HELP = (
    f"{MULTIPART_FILE_UPLOAD_NOTE}\n\n"
    "Field `image_url` — chọn file ảnh (không nhập URL text)."
)

DealerProductImageCreateForm = inline_serializer(
    name="DealerProductImageCreateForm",
    fields={
        "dealer_product": serializers.IntegerField(help_text="ID sản phẩm đại lý"),
        "image_url": serializers.FileField(help_text=IMAGE_FILE_HELP),
        "is_thumbnail": serializers.BooleanField(
            required=False,
            default=False,
            help_text="true = ảnh đại diện",
        ),
        "sort_order": serializers.IntegerField(
            required=False,
            default=0,
            help_text="Thứ tự hiển thị",
        ),
    },
)

DealerProductImageUpdateForm = inline_serializer(
    name="DealerProductImageUpdateForm",
    fields={
        "image_url": serializers.FileField(
            required=False,
            help_text=IMAGE_FILE_HELP,
        ),
        "is_thumbnail": serializers.BooleanField(
            required=False,
            help_text="true = ảnh đại diện",
        ),
        "sort_order": serializers.IntegerField(
            required=False,
            help_text="Thứ tự hiển thị",
        ),
    },
)

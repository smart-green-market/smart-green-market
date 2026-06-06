"""OpenAPI schema cho upload ảnh sản phẩm (Swagger UI hiển thị nút chọn file)."""

from rest_framework import serializers
from drf_spectacular.utils import inline_serializer

SupplierProductImageUploadForm = inline_serializer(
    name="SupplierProductImageUploadForm",
    fields={
        "supplier_product": serializers.IntegerField(
            help_text="ID sản phẩm cần gắn ảnh",
        ),
        "image_url": serializers.FileField(
            help_text="Ảnh sản phẩm (jpg, png, webp — tối đa 5MB)",
        ),
        "is_thumbnail": serializers.BooleanField(
            required=False,
            default=False,
            help_text="true = ảnh đại diện (chỉ 1 ảnh/sản phẩm)",
        ),
        "sort_order": serializers.IntegerField(
            required=False,
            default=0,
            help_text="Thứ tự hiển thị (số nhỏ hiện trước)",
        ),
    },
)

SupplierProductImageReplaceForm = inline_serializer(
    name="SupplierProductImageReplaceForm",
    fields={
        "image_url": serializers.FileField(
            help_text="Ảnh mới (jpg, png, webp — tối đa 5MB)",
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

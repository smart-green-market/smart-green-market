"""OpenAPI schema upload logo đại lý (Swagger hiển thị nút chọn file)."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from common.openapi_files import LOGO_FILE_HELP, MULTIPART_FILE_UPLOAD_NOTE

DEALER_PROFILE_WRITE_HELP = (
    f"{MULTIPART_FILE_UPLOAD_NOTE}\n\n"
    "Gửi thông tin cửa hàng; `logo` là file ảnh (tùy chọn)."
)

DealerProfileCreateForm = inline_serializer(
    name="DealerProfileCreateForm",
    fields={
        "store_name": serializers.CharField(help_text="Tên cửa hàng / đại lý"),
        "store_address": serializers.CharField(help_text="Địa chỉ cửa hàng"),
        "description": serializers.CharField(
            required=False,
            allow_blank=True,
            help_text="Giới thiệu ngắn",
        ),
        "logo": serializers.FileField(
            required=False,
            help_text=LOGO_FILE_HELP,
        ),
    },
)

DealerProfileUpdateForm = inline_serializer(
    name="DealerProfileUpdateForm",
    fields={
        "store_name": serializers.CharField(
            required=False,
            help_text="Tên cửa hàng / đại lý",
        ),
        "store_address": serializers.CharField(
            required=False,
            help_text="Địa chỉ cửa hàng",
        ),
        "description": serializers.CharField(
            required=False,
            allow_blank=True,
            help_text="Giới thiệu ngắn",
        ),
        "logo": serializers.FileField(
            required=False,
            help_text=LOGO_FILE_HELP,
        ),
    },
)

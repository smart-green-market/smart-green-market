"""OpenAPI schema cho buyer storefront (Swagger hiển thị nút chọn file)."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from common.openapi_files import AVATAR_FILE_HELP, MULTIPART_FILE_UPLOAD_NOTE

STOREFRONT_PROFILE_UPDATE_HELP = (
    f"{MULTIPART_FILE_UPLOAD_NOTE}\n\n"
    "**Cập nhật hồ sơ buyer** tại gian hàng đang đăng nhập.\n\n"
    "- `full_name`, `phone` — thông tin liên hệ\n"
    "- `favorite_category` — ID danh mục yêu thích (số nguyên, có thể để trống)\n"
    "- `avatar` — ảnh đại diện (chọn file; response trả `user.avatar_url`)\n\n"
    "Có thể gửi chỉ các field cần đổi. "
    "Upload avatar riêng: `POST /api/profile/avatar/`."
)

StorefrontCustomerProfileUpdateForm = inline_serializer(
    name="StorefrontCustomerProfileUpdateForm",
    fields={
        "full_name": serializers.CharField(
            required=False,
            allow_blank=True,
            help_text="Họ và tên hiển thị",
        ),
        "phone": serializers.CharField(
            required=False,
            allow_blank=True,
            max_length=20,
            help_text="Số điện thoại",
        ),
        "favorite_category": serializers.IntegerField(
            required=False,
            allow_null=True,
            help_text="ID danh mục yêu thích (để trống = bỏ chọn)",
        ),
        "avatar": serializers.FileField(
            required=False,
            help_text=AVATAR_FILE_HELP,
        ),
    },
)

"""Form multipart chuẩn cho Swagger — trường ảnh/file hiển thị nút Choose file."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from common.business_rules import MAX_UPLOAD_IMAGE_SIZE_MB, allowed_image_extensions_label

_IMAGE_TYPES = allowed_image_extensions_label()

IMAGE_FILE_HELP = (
    f"Chọn file ảnh ({_IMAGE_TYPES} — tối đa {MAX_UPLOAD_IMAGE_SIZE_MB}MB)"
)
LOGO_FILE_HELP = f"Logo cửa hàng/NCC (JPG/PNG/WebP — tối đa {MAX_UPLOAD_IMAGE_SIZE_MB}MB)"
AVATAR_FILE_HELP = f"Ảnh đại diện (JPG/PNG/WebP — tối đa {MAX_UPLOAD_IMAGE_SIZE_MB}MB)"
DOCUMENT_FILE_HELP = "Chọn file giấy tờ (PDF, JPG, PNG — tối đa 5MB)"
RECEIPT_FILE_HELP = "Chọn ảnh/PDF biên lai chuyển khoản"

MULTIPART_FILE_UPLOAD_NOTE = (
    "Dùng **`multipart/form-data`**. "
    "Mọi trường ảnh/tài liệu — bấm **Choose file** trên Swagger (không nhập URL tay)."
)


def multipart_request(form):
    """Gói inline serializer thành request body multipart cho extend_schema."""
    return {"multipart/form-data": form}


AvatarUploadForm = inline_serializer(
    name="AvatarUploadForm",
    fields={
        "avatar": serializers.FileField(help_text=AVATAR_FILE_HELP),
    },
)

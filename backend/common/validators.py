import os

from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

from .business_rules import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_UPLOAD_IMAGE_SIZE_BYTES,
    MAX_UPLOAD_IMAGE_SIZE_MB,
)


def validate_image_upload(file):
    if file is None:
        return

    content_type = getattr(file, "content_type", "")
    if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise DRFValidationError(
            f"Định dạng ảnh không hợp lệ. Chỉ chấp nhận: jpg, png, webp."
        )

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise DRFValidationError(
            f"Phần mở rộng file không hợp lệ ({ext}). Chỉ chấp nhận: jpg, png, webp."
        )

    if file.size > MAX_UPLOAD_IMAGE_SIZE_BYTES:
        raise DRFValidationError(
            f"Dung lượng ảnh vượt quá {MAX_UPLOAD_IMAGE_SIZE_MB}MB "
            f"(hiện tại: {file.size / (1024 * 1024):.2f}MB)."
        )


def validate_image_upload_django(file):
    try:
        validate_image_upload(file)
    except DRFValidationError as exc:
        detail = exc.detail
        if isinstance(detail, list):
            message = str(detail[0])
        else:
            message = str(detail)
        raise ValidationError(message) from exc

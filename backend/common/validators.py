"""Validator kiểm tra file ảnh upload (định dạng, phần mở rộng, dung lượng)."""

import os

from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

from .business_rules import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_UPLOAD_IMAGE_SIZE_BYTES,
    MAX_UPLOAD_IMAGE_SIZE_MB,
    allowed_image_extensions_label,
)


def validate_image_upload(file):
    """Kiểm tra file ảnh hợp lệ cho DRF; raise ValidationError nếu không hợp lệ."""
    if file is None:
        return

    content_type = getattr(file, "content_type", "")
    if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise DRFValidationError(
            f"Định dạng ảnh không hợp lệ. "
            f"Chỉ chấp nhận: {allowed_image_extensions_label()}."
        )

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise DRFValidationError(
            f"Phần mở rộng file không hợp lệ ({ext}). "
            f"Chỉ chấp nhận: {allowed_image_extensions_label()}."
        )

    if file.size > MAX_UPLOAD_IMAGE_SIZE_BYTES:
        raise DRFValidationError(
            f"Dung lượng ảnh vượt quá {MAX_UPLOAD_IMAGE_SIZE_MB}MB "
            f"(hiện tại: {file.size / (1024 * 1024):.2f}MB)."
        )


REJECTION_REASON_REQUIRED_MSG = "Vui lòng nhập lý do từ chối."


def require_rejection_reason(attrs, status_field, reason_field, rejected_statuses):
    """Bắt buộc reason_field không rỗng khi status_field thuộc rejected_statuses."""
    status = attrs.get(status_field)
    if status in rejected_statuses:
        reason = (attrs.get(reason_field) or "").strip()
        if not reason:
            raise DRFValidationError({reason_field: REJECTION_REASON_REQUIRED_MSG})
        attrs[reason_field] = reason
    return attrs


def validate_image_upload_django(file):
    """Bọc validate_image_upload, chuyển lỗi sang ValidationError của Django."""
    try:
        validate_image_upload(file)
    except DRFValidationError as exc:
        detail = exc.detail
        if isinstance(detail, list):
            message = str(detail[0])
        else:
            message = str(detail)
        raise ValidationError(message) from exc

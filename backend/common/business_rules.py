"""Quy tắc nghiệp vụ hệ thống — có thể đọc qua GET /api/system-config/."""

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.exceptions import ValidationError

MAX_UPLOAD_IMAGE_SIZE_MB = 5
MAX_UPLOAD_IMAGE_SIZE_BYTES = MAX_UPLOAD_IMAGE_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/avif",
    "image/heic",
    "image/heif",
}
ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".jfif",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".avif",
    ".heic",
    ".heif",
}


def allowed_image_extensions_label():
    """Trả chuỗi danh sách phần mở rộng ảnh cho phép (dùng trong thông báo lỗi)."""
    return ", ".join(sorted(ext.lstrip(".") for ext in ALLOWED_IMAGE_EXTENSIONS))

DEFAULT_DEPOSIT_PERCENT = 30
MIN_DEPOSIT_PERCENT = 10
MAX_DEPOSIT_PERCENT = 50

MIN_ORDER_AMOUNT = 500_000
MAX_ORDER_AMOUNT = 500_000_000
MIN_DELIVERY_LEAD_DAYS = 2

MAX_CATEGORIES_PER_SUPPLIER = 5
MAX_PRODUCTS_PER_SUPPLIER = 100
MAX_IMAGES_PER_PRODUCT = 5
MAX_IMAGES_PER_CERTIFICATION = 5
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15


def get_purchase_order_config():
    """Cấu hình phiếu nhập — dùng cho UI dealer/NCC và validate backend."""
    return {
        "min_order_amount": MIN_ORDER_AMOUNT,
        "max_order_amount": MAX_ORDER_AMOUNT,
        "min_deposit_percent": MIN_DEPOSIT_PERCENT,
        "max_deposit_percent": MAX_DEPOSIT_PERCENT,
        "min_delivery_lead_days": MIN_DELIVERY_LEAD_DAYS,
        "default_deposit_percent": DEFAULT_DEPOSIT_PERCENT,
    }


def validate_order_amount(total_amount):
    """Kiểm tra tổng tiền đơn nằm trong giới hạn hệ thống."""
    total = Decimal(total_amount)
    if MIN_ORDER_AMOUNT and total < Decimal(MIN_ORDER_AMOUNT):
        raise ValidationError(
            {
                "total_amount": (
                    f"Tổng đơn tối thiểu {MIN_ORDER_AMOUNT:,} VND "
                    f"(hiện tại {total:,.0f} VND)."
                ).replace(",", ".")
            }
        )
    if MAX_ORDER_AMOUNT and total > Decimal(MAX_ORDER_AMOUNT):
        raise ValidationError(
            {
                "total_amount": (
                    f"Tổng đơn tối đa {MAX_ORDER_AMOUNT:,} VND "
                    f"(hiện tại {total:,.0f} VND)."
                ).replace(",", ".")
            }
        )


def validate_requested_delivery_time(requested_delivery_time):
    """Thời gian giao phải sau ít nhất MIN_DELIVERY_LEAD_DAYS ngày kể từ hiện tại."""
    if MIN_DELIVERY_LEAD_DAYS <= 0:
        return
    earliest = timezone.now() + timedelta(days=MIN_DELIVERY_LEAD_DAYS)
    if requested_delivery_time < earliest:
        raise ValidationError(
            {
                "requested_delivery_time": (
                    f"Thời gian giao phải sau ít nhất {MIN_DELIVERY_LEAD_DAYS} ngày "
                    f"kể từ bây giờ (sớm nhất: {earliest.strftime('%d/%m/%Y %H:%M')})."
                )
            }
        )


def validate_deposit_percent(percent):
    """Kiểm tra tỷ lệ cọc trong khoảng cấu hình."""
    value = Decimal(percent)
    min_p = Decimal(MIN_DEPOSIT_PERCENT)
    max_p = Decimal(MAX_DEPOSIT_PERCENT)
    if value < min_p or value > max_p:
        raise ValidationError(
            {
                "deposit_percent": (
                    f"Tỷ lệ cọc phải từ {MIN_DEPOSIT_PERCENT}% đến {MAX_DEPOSIT_PERCENT}%."
                )
            }
        )
    return value


def get_public_config():
    """Trả dict cấu hình nghiệp vụ công khai cho API system-config."""
    return {
        "max_upload_image_size_mb": MAX_UPLOAD_IMAGE_SIZE_MB,
        "allowed_image_types": sorted(ALLOWED_IMAGE_EXTENSIONS),
        "max_categories_per_supplier": MAX_CATEGORIES_PER_SUPPLIER,
        "max_products_per_supplier": MAX_PRODUCTS_PER_SUPPLIER,
        "max_images_per_product": MAX_IMAGES_PER_PRODUCT,
        "max_images_per_certification": MAX_IMAGES_PER_CERTIFICATION,
        "max_login_attempts": MAX_LOGIN_ATTEMPTS,
        "login_lockout_minutes": LOGIN_LOCKOUT_MINUTES,
        **get_purchase_order_config(),
    }

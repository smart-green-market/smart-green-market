"""Quy tắc nghiệp vụ hệ thống — đọc từ DB (admin chỉnh qua PATCH /api/system-config/)."""

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.system_config.services import get_system_settings

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


def get_purchase_order_config():
    """Cấu hình phiếu nhập — expose qua GET /api/purchase-order-config/."""
    s = get_system_settings()
    return {
        "min_order_amount": s.min_order_amount,
        "max_order_amount": s.max_order_amount,
        "min_deposit_percent": s.min_deposit_percent,
        "max_deposit_percent": s.max_deposit_percent,
        "min_delivery_lead_days": s.min_delivery_lead_days,
        "default_deposit_percent": s.default_deposit_percent,
    }


def get_customer_order_config():
    """Cấu hình đơn buyer — phí ship cố định + khung giờ giao."""
    from apps.orders.delivery_slots import get_delivery_slot_config

    s = get_system_settings()
    return {
        "shipping_fee": s.shipping_fee,
        "payment_type": "cod",
        **get_delivery_slot_config(),
    }


def validate_order_amount(total_amount):
    """Kiểm tra tổng tiền đơn trong [min, max] — gọi sau build_order_items."""
    s = get_system_settings()
    total = Decimal(total_amount)
    if s.min_order_amount and total < Decimal(s.min_order_amount):
        raise ValidationError(
            {
                "total_amount": (
                    f"Tổng đơn tối thiểu {s.min_order_amount:,} VND "
                    f"(hiện tại {total:,.0f} VND)."
                ).replace(",", ".")
            }
        )
    if s.max_order_amount and total > Decimal(s.max_order_amount):
        raise ValidationError(
            {
                "total_amount": (
                    f"Tổng đơn tối đa {s.max_order_amount:,} VND "
                    f"(hiện tại {total:,.0f} VND)."
                ).replace(",", ".")
            }
        )


def validate_requested_delivery_time(requested_delivery_time):
    """Thời gian giao phải sau ít nhất min_delivery_lead_days ngày kể từ hiện tại."""
    s = get_system_settings()
    if s.min_delivery_lead_days <= 0:
        return
    earliest = timezone.now() + timedelta(days=s.min_delivery_lead_days)
    if requested_delivery_time < earliest:
        raise ValidationError(
            {
                "requested_delivery_time": (
                    f"Thời gian giao phải sau ít nhất {s.min_delivery_lead_days} ngày "
                    f"kể từ bây giờ (sớm nhất: {earliest.strftime('%d/%m/%Y %H:%M')})."
                )
            }
        )


def validate_deposit_percent(percent):
    """Kiểm tra % cọc NCC chốt khi confirm — gọi từ supplier_confirm_order."""
    s = get_system_settings()
    value = Decimal(percent)
    min_p = Decimal(s.min_deposit_percent)
    max_p = Decimal(s.max_deposit_percent)
    if value < min_p or value > max_p:
        raise ValidationError(
            {
                "deposit_percent": (
                    f"Tỷ lệ cọc phải từ {s.min_deposit_percent}% đến {s.max_deposit_percent}%."
                )
            }
        )
    return value


def get_public_config():
    """Trả dict cấu hình nghiệp vụ cho API system-config."""
    s = get_system_settings()
    purchase_orders = get_purchase_order_config()
    customer_orders = get_customer_order_config()
    return {
        "max_upload_image_size_mb": s.max_upload_image_size_mb,
        "allowed_image_types": sorted(ALLOWED_IMAGE_EXTENSIONS),
        "max_categories_per_supplier": s.max_categories_per_supplier,
        "max_products_per_supplier": s.max_products_per_supplier,
        "max_images_per_product": s.max_images_per_product,
        "max_images_per_certification": s.max_images_per_certification,
        "max_login_attempts": s.max_login_attempts,
        "login_lockout_minutes": s.login_lockout_minutes,
        "purchase_orders": purchase_orders,
        "customer_orders": customer_orders,
        "updated_at": s.updated_at,
        "updated_by": s.updated_by_id,
        "updated_by_username": (
            s.updated_by.username if s.updated_by_id else None
        ),
        **purchase_orders,
        **customer_orders,
    }

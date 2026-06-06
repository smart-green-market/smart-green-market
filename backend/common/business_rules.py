"""Quy tắc nghiệp vụ hệ thống — có thể đọc qua GET /api/system-config/."""

MAX_UPLOAD_IMAGE_SIZE_MB = 5
MAX_UPLOAD_IMAGE_SIZE_BYTES = MAX_UPLOAD_IMAGE_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

MAX_CATEGORIES_PER_SUPPLIER = 5
MAX_PRODUCTS_PER_SUPPLIER = 100
MAX_IMAGES_PER_PRODUCT = 5
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15


def get_public_config():
    return {
        "max_upload_image_size_mb": MAX_UPLOAD_IMAGE_SIZE_MB,
        "allowed_image_types": sorted(ALLOWED_IMAGE_EXTENSIONS),
        "max_categories_per_supplier": MAX_CATEGORIES_PER_SUPPLIER,
        "max_products_per_supplier": MAX_PRODUCTS_PER_SUPPLIER,
        "max_images_per_product": MAX_IMAGES_PER_PRODUCT,
        "max_login_attempts": MAX_LOGIN_ATTEMPTS,
        "login_lockout_minutes": LOGIN_LOCKOUT_MINUTES,
    }

"""Mô tả và ví dụ Swagger cho API nhà cung cấp."""

from drf_spectacular.utils import OpenApiExample

SUPPLIER_PRODUCTS_CATALOG_HELP = (
    "\n\n**Điều kiện (Dealer):**\n"
    "- NCC `verification_status=approved`, tài khoản `active`\n"
    "- Sản phẩm `status=active`, đã có `wholesale_price`\n\n"
    "**Dùng `id` trong `results[].id` làm `supplier_product_id` khi `POST /api/purchase-orders/`.**"
)

SUPPLIER_CATALOG_DETAIL_EXAMPLE = OpenApiExample(
    "Chi tiết NCC (dealer — liên hệ, chứng nhận, quy mô)",
    value={
        "id": 14,
        "company_name": "Cong ty Nong San ABC",
        "tax_code": "0123456789",
        "phone": "0901234567",
        "address": "123 Duong X, Ha Noi",
        "description": "Trang trai 5ha, chuyen rau cu huu co phuc vu dai ly Ha Noi",
        "active_product_count": 12,
        "approved_certification_count": 2,
        "total_daily_production_capacity": "850.00",
        "created_at": "2026-06-01T09:00:00Z",
        "contact": {
            "id": 8,
            "username": "ncc_abc",
            "full_name": "Nguyen Van A",
            "email": "contact@nongsanabc.vn",
            "phone": "0901234567",
            "avatar_url": "https://example.com/media/avatars/ncc.jpg",
        },
        "certifications": [
            {
                "id": 3,
                "name": "VietGAP",
                "certificate_code": "VG-2024-001",
                "issued_by": "Bo NNPTNT",
                "issue_date": "2024-01-15",
                "expiry_date": "2027-01-15",
                "description": "Chung nhan VietGAP vung trong",
                "is_expired": False,
                "images": [
                    {
                        "id": 1,
                        "certification": 3,
                        "image_url": "https://example.com/media/cert/vietgap.jpg",
                        "sort_order": 0,
                        "created_at": "2026-05-01T10:00:00Z",
                    }
                ],
            }
        ],
    },
    response_only=True,
)

SUPPLIER_CATALOG_LIST_EXAMPLE = OpenApiExample(
    "Catalog NCC cho dealer (bước 1 đặt hàng)",
    value={
        "count": 1,
        "next": None,
        "previous": None,
        "page": 1,
        "page_size": 20,
        "has_more": False,
        "results": [
            {
                "id": 3,
                "company_name": "Cong ty Nong San ABC",
                "tax_code": "0123456789",
                "phone": "0901234567",
                "address": "123 Duong X, Ha Noi",
                "description": "Chuyen cung cap rau cu huu co",
                "active_product_count": 5,
                "created_at": "2026-06-01T09:00:00Z",
            }
        ],
    },
    response_only=True,
)

SUPPLIER_PRODUCTS_BY_SUPPLIER_EXAMPLE = OpenApiExample(
    "Danh sách SP của NCC (dealer chọn mua)",
    value={
        "count": 1,
        "next": None,
        "previous": None,
        "page": 1,
        "page_size": 20,
        "has_more": False,
        "results": [
            {
                "id": 12,
                "name": "Rau muống hữu cơ",
                "slug": "rau-muong-huu-co",
                "unit": "kg",
                "wholesale_price": "25000.00",
                "daily_production_capacity": "100.00",
                "description": "Rau muống VietGAP",
                "storage_duration_days": 3,
                "min_storage_temp": "2.00",
                "max_storage_temp": "8.00",
                "status": "active",
                "verified_by": 1,
                "verified_by_username": "admin",
                "verified_at": "2026-06-10T08:00:00Z",
                "rejection_reason": "",
                "created_at": "2026-06-09T10:00:00Z",
                "updated_at": "2026-06-10T08:00:00Z",
                "images": [
                    {
                        "id": 5,
                        "supplier_product": 12,
                        "image_url": "https://example.com/media/product_images/rau.jpg",
                        "is_thumbnail": True,
                        "sort_order": 0,
                        "created_at": "2026-06-09T10:05:00Z",
                    }
                ],
                "supplier": {
                    "id": 3,
                    "company_name": "Cong ty Nong San ABC",
                    "tax_code": "0123456789",
                    "phone": "0901234567",
                },
                "category": {
                    "id": 2,
                    "name": "Rau củ",
                    "sort_order": 1,
                },
            }
        ],
    },
    response_only=True,
)

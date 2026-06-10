"""Mô tả và ví dụ Swagger cho action verify / từ chối."""

from drf_spectacular.utils import OpenApiExample

VERIFY_REJECT_HELP = (
    "\n\n**Lý do từ chối (bắt buộc):** Khi trạng thái là `rejected` "
    "(hoặc `inactive` nếu API hỗ trợ khóa), phải gửi `rejection_reason` "
    "không rỗng — thiếu sẽ trả lỗi 400."
)

SUPPLIER_VERIFY_APPROVE = OpenApiExample(
    "Duyệt NCC",
    value={"verification_status": "approved"},
    request_only=True,
)
SUPPLIER_VERIFY_REJECT = OpenApiExample(
    "Từ chối NCC",
    value={
        "verification_status": "rejected",
        "rejection_reason": "Giấy tờ chưa khớp thông tin công ty",
    },
    request_only=True,
)

DEALER_VERIFY_APPROVE = OpenApiExample(
    "Duyệt đại lý",
    value={"status": "active"},
    request_only=True,
)
DEALER_VERIFY_REJECT = OpenApiExample(
    "Từ chối đại lý",
    value={
        "status": "rejected",
        "rejection_reason": "Địa chỉ cửa hàng không hợp lệ",
    },
    request_only=True,
)

DOCUMENT_VERIFY_APPROVE = OpenApiExample(
    "Duyệt giấy tờ",
    value={"status": "approved"},
    request_only=True,
)
DOCUMENT_VERIFY_REJECT = OpenApiExample(
    "Từ chối giấy tờ",
    value={
        "status": "rejected",
        "rejection_reason": "Ảnh mờ, không đọc được số giấy tờ",
    },
    request_only=True,
)

CATEGORY_VERIFY_APPROVE = OpenApiExample(
    "Duyệt danh mục",
    value={"status": "active"},
    request_only=True,
)
CATEGORY_VERIFY_REJECT = OpenApiExample(
    "Từ chối danh mục",
    value={
        "status": "rejected",
        "rejection_reason": "Tên danh mục trùng nghĩa với danh mục có sẵn",
    },
    request_only=True,
)
CATEGORY_VERIFY_INACTIVE = OpenApiExample(
    "Khóa danh mục",
    value={
        "status": "inactive",
        "rejection_reason": "Vi phạm quy định đặt tên danh mục",
    },
    request_only=True,
)

CERT_VERIFY_APPROVE = OpenApiExample(
    "Duyệt chứng nhận",
    value={"status": "approved"},
    request_only=True,
)
CERT_VERIFY_REJECT = OpenApiExample(
    "Từ chối chứng nhận",
    value={
        "status": "rejected",
        "rejection_reason": "Ảnh scan không đủ rõ mã chứng nhận",
    },
    request_only=True,
)
CERT_REVOKE = OpenApiExample(
    "Thu hồi chứng nhận",
    value={"revoke_reason": "Chứng nhận hết hạn và không gia hạn"},
    request_only=True,
)

SUPPLIER_PRODUCT_VERIFY_APPROVE = OpenApiExample(
    "Duyệt sản phẩm NCC",
    value={"status": "active"},
    request_only=True,
)
SUPPLIER_PRODUCT_VERIFY_REJECT = OpenApiExample(
    "Từ chối sản phẩm NCC",
    value={
        "status": "rejected",
        "rejection_reason": "Mô tả sản phẩm không đầy đủ",
    },
    request_only=True,
)

DEALER_PRODUCT_VERIFY_APPROVE = OpenApiExample(
    "Duyệt sản phẩm đại lý",
    value={"status": "active"},
    request_only=True,
)
DEALER_PRODUCT_VERIFY_REJECT = OpenApiExample(
    "Từ chối sản phẩm đại lý",
    value={
        "status": "rejected",
        "rejection_reason": "Giá bán lẻ không hợp lý",
    },
    request_only=True,
)

PO_REJECT = OpenApiExample(
    "NCC từ chối phiếu nhập",
    value={"rejection_reason": "Không đủ năng lực sản xuất trong thời gian yêu cầu"},
    request_only=True,
)

PO_VERIFY_PAYMENT_APPROVE = OpenApiExample(
    "Xác nhận thanh toán",
    value={"payment_id": 1, "status": "verified"},
    request_only=True,
)
PO_VERIFY_PAYMENT_REJECT = OpenApiExample(
    "Từ chối thanh toán",
    value={
        "payment_id": 1,
        "status": "rejected",
        "rejection_reason": "Số tiền trên biên lai không khớp",
    },
    request_only=True,
)

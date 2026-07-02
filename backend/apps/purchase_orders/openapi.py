"""Mô tả Swagger (drf-spectacular) — phiếu nhập hàng, theo luồng UI."""

from drf_spectacular.utils import OpenApiExample, inline_serializer
from rest_framework import serializers

from apps.purchase_orders.models import PurchaseOrderPaymentMethod
from common.openapi_files import RECEIPT_FILE_HELP
from common.purchase_orders_swagger import PURCHASE_ORDERS_TAG_DESCRIPTION

# Re-export for convenience
__all__ = ["PURCHASE_ORDERS_TAG_DESCRIPTION"]

PO_CONFIG_DESCRIPTION = (
    "**Bước 0 — Cấu hình (gọi trước màn tạo phiếu).** Không cần đăng nhập.\n\n"
    "UI dealer dùng:\n"
    "- `min_order_amount` / `max_order_amount` — validate tổng tiền **mỗi phiếu** (mỗi NCC)\n"
    "- `min_delivery_lead_days` — chặn chọn ngày giao mong muốn quá sớm\n\n"
    "UI NCC dùng khi gọi `confirm/`:\n"
    "- `min_deposit_percent`, `max_deposit_percent`, `default_deposit_percent`\n"
    "- `min_delivery_lead_days` — ngày giao cam kết sớm nhất (từ lúc confirm)\n"
    "- `max_delivery_delay_days` — muộn nhất so với ngày dealer mong muốn"
)

PO_LIST_DESCRIPTION = (
    "**Danh sách phiếu nhập** — phân trang `?page=&page_size=`.\n\n"
    "| Role | Thấy gì |\n"
    "|------|----------|\n"
    "| dealer | Phiếu của đại lý mình |\n"
    "| supplier | Phiếu gửi tới NCC mình |\n"
    "| admin | Tất cả |\n\n"
    "Dùng cho màn danh sách; lọc/tab theo `status` phía client."
)

PO_RETRIEVE_DESCRIPTION = (
    "**Chi tiết một phiếu** — dùng làm màn chi tiết và poll sau mỗi action.\n\n"
    "Field quan trọng cho UI:\n"
    "- `status` — quyết định nút hành động hiển thị\n"
    "- `items[]` — SP, giá snapshot, ảnh\n"
    "- `payments[]` — lấy `payment_id` cho `verify-payment/`\n"
    "- `supplier_bank` + `payment-qr/` — VietQR\n"
    "- `deposit_amount`, `debt_amount`, `total_amount`"
)

PO_CREATE_DESCRIPTION = (
    "**Bước 1 — Dealer gửi giỏ hàng.** Role: `dealer`.\n\n"
    "### Body\n"
    "- **Không cần** `supplier_id` nếu giỏ có SP từ nhiều NCC\n"
    "- `items[].supplier_product_id` — từ catalog NCC (`GET /api/supplier-products/`)\n"
    "- Thông tin giao hàng dùng chung cho mọi phiếu tách ra\n\n"
    "### Backend\n"
    "Nhóm `items` theo NCC → tạo **n phiếu** (validate min/max tiền **từng phiếu**).\n\n"
    "### Response 201\n"
    "```json\n"
    "{ \"orders\": [ { \"id\", \"order_code\", \"supplier\", \"status\", ... } ] }\n"
    "```\n"
    "Mỗi phần tử: `status = pending_supplier_confirmation`.\n\n"
    "**UI:** chuyển sang danh sách/chi tiết từng phiếu trong `orders`."
)

PO_CONFIRM_DESCRIPTION = (
    "**Bước 2a — NCC chấp nhận phiếu.** Role: `supplier` (chủ phiếu).\n\n"
    "Điều kiện: `status = pending_supplier_confirmation`.\n\n"
    "Body: `confirmed_delivery_time`, `deposit_percent` (optional), `note`, "
    "`items[]` (optional — duyệt từng dòng SP).\n\n"
    "| Kết quả | Khi nào |\n"
    "|---------|--------|\n"
    "| `confirmed` | Không đổi ngày giao và không đổi SP/số lượng |\n"
    "| `pending_dealer_confirmation` | NCC đổi ngày giao hoặc từ chối/điều chỉnh SP |\n\n"
    "Dealer tiếp theo: `approve-adjustment/` hoặc `cancel/` nếu chờ duyệt; "
    "nộp cọc nếu `confirmed`."
)

PO_APPROVE_ADJUSTMENT_DESCRIPTION = (
    "**Bước 2c — Dealer đồng ý điều chỉnh của NCC.** Role: `dealer` (chủ phiếu).\n\n"
    "Điều kiện: `status = pending_dealer_confirmation`.\n"
    "Body: `note` (optional).\n\n"
    "Sau thành công: `status = confirmed` → dealer có thể nộp cọc.\n"
    "Không đồng ý: gọi `POST .../cancel/` với `reason`."
)

PO_REJECT_DESCRIPTION = (
    "**Bước 2b — NCC từ chối phiếu.** Role: `supplier`.\n\n"
    "Điều kiện: `status = pending_supplier_confirmation`.\n"
    "Bắt buộc `rejection_reason`. Kết thúc: `status = rejected`."
)

PO_PAYMENT_QR_DESCRIPTION = (
    "**Bước 3 / 8 — Lấy QR VietQR.** Role: `dealer` (hoặc admin).\n\n"
    "| Query | Khi nào gọi | `status` cần |\n"
    "|-------|-------------|---------------|\n"
    "| `payment_type=deposit` | Trước nộp cọc | `confirmed` |\n"
    "| `payment_type=final_payment` | Sau nhận hàng | `delivered` |\n\n"
    "Hiển thị `qr_image_url` trong `<img>`. Số tiền = `deposit_amount` hoặc `debt_amount`."
)

PO_SUBMIT_DEPOSIT_DESCRIPTION = (
    "**Bước 4 — Dealer nộp biên lai cọc.** Role: `dealer`. Multipart.\n\n"
    "Điều kiện: `status = confirmed`.\n"
    "Tối thiểu: `payment_method` + `receipt_file`. Không gửi số tiền — server lấy `deposit_amount`.\n\n"
    "Sau thành công: `status = deposit_pending_verification`.\n"
    "**UI NCC:** duyệt qua `verify-payment/`."
)

PO_SUBMIT_FINAL_DESCRIPTION = (
    "**Bước 9 — Dealer nộp biên lai thanh toán cuối.** Role: `dealer`. Multipart.\n\n"
    "Điều kiện: `status = delivered`.\n"
    "Số tiền = `debt_amount` còn lại.\n\n"
    "Sau thành công: `status = final_payment_pending_verification`."
)

PO_VERIFY_PAYMENT_DESCRIPTION = (
    "**Bước 5 / 10 — NCC duyệt hoặc từ chối CK.** Role: `supplier`.\n\n"
    "`payment_id` lấy từ `GET .../{id}/` → `payments[]` (bản ghi `status=pending`).\n\n"
    "| Duyệt cọc OK | `status` đơn → `processing` |\n"
    "| Từ chối cọc | → `confirmed` (dealer nộp lại) |\n"
    "| Duyệt cuối OK | → `completed` (nhập kho dealer) |\n"
    "| Từ chối cuối | → `delivered` |\n\n"
    "Từ chối: bắt buộc `rejection_reason`."
)

PO_SHIP_DESCRIPTION = (
    "**Bước 6 — NCC bắt đầu giao.** Role: `supplier`.\n\n"
    "Điều kiện: `status = processing`.\n"
    "Sau thành công: `status = shipping`."
)

PO_CONFIRM_DELIVERY_DESCRIPTION = (
    "**Bước 7 — Dealer xác nhận đã nhận hàng.** Role: `dealer`.\n\n"
    "Điều kiện: `status = shipping`.\n"
    "Sau thành công: `status = delivered` → dealer thanh toán phần còn lại."
)

PO_CANCEL_DESCRIPTION = (
    "**Hủy phiếu.** Role: `dealer` (phiếu của mình) hoặc `admin`.\n\n"
    "| Role | Được hủy khi |\n"
    "|------|----------------|\n"
    "| dealer | `pending_supplier_confirmation`, `pending_dealer_confirmation`, `confirmed` |\n"
    "| admin | Mọi trạng thái chưa `completed` / `rejected` / `cancelled` |"
)

SUBMIT_PAYMENT_MINIMAL_HELP = (
    "Multipart — **tối thiểu** `payment_method` + `receipt_file`.\n"
    "Không gửi `amount`; server tính từ phiếu."
)

SubmitPaymentForm = inline_serializer(
    name="SubmitPaymentForm",
    fields={
        "payment_method": serializers.ChoiceField(
            choices=PurchaseOrderPaymentMethod.choices,
            help_text="Thường `bank_transfer` sau khi quét VietQR",
        ),
        "receipt_file": serializers.FileField(
            help_text=RECEIPT_FILE_HELP,
        ),
        "payment_provider": serializers.CharField(
            required=False,
            help_text="Tên ngân hàng/ví — tùy chọn",
        ),
        "transaction_code": serializers.CharField(
            required=False,
            help_text="Mã giao dịch — khuyến nghị",
        ),
        "note": serializers.CharField(
            required=False,
            help_text="Ghi chú — tùy chọn",
        ),
        "paid_at": serializers.DateTimeField(
            required=False,
            allow_null=True,
            help_text="Thời điểm CK — bỏ trống thì server dùng thời gian hiện tại",
        ),
    },
)

PO_CREATE_REQUEST_EXAMPLE = OpenApiExample(
    "Giỏ nhiều NCC (khuyến nghị)",
    value={
        "delivery_address": "123 Kho DL, Q1, TP.HCM",
        "requested_delivery_time": "2026-06-15T08:00:00+07:00",
        "receiver_name": "Nguyen Van A",
        "receiver_phone": "0901234567",
        "note": "",
        "items": [
            {"supplier_product_id": 5, "quantity": "50", "note": ""},
            {"supplier_product_id": 12, "quantity": "30", "note": ""},
        ],
    },
    request_only=True,
    description="SP 5 và 12 thuộc 2 NCC khác nhau → response `orders` có 2 phiếu.",
)

PO_CREATE_RESPONSE_EXAMPLE = OpenApiExample(
    "Response — 2 phiếu",
    value={
        "orders": [
            {
                "id": 101,
                "order_code": "PN-20260615-0001-0001",
                "supplier": 1,
                "supplier_name": "NCC Rau A",
                "status": "pending_supplier_confirmation",
                "total_amount": "1500000.00",
            },
            {
                "id": 102,
                "order_code": "PN-20260615-0001-0002",
                "supplier": 2,
                "supplier_name": "NCC Rau B",
                "status": "pending_supplier_confirmation",
                "total_amount": "900000.00",
            },
        ],
    },
    response_only=True,
)

SUBMIT_PAYMENT_EXAMPLE_NOTE = OpenApiExample(
    "Nộp biên lai (tối thiểu)",
    value={
        "payment_method": "bank_transfer",
    },
    request_only=True,
    description="Trên Swagger: chọn file `receipt_file` — chỉ cần 2 field trên.",
)

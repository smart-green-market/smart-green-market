"""OpenAPI schema cho upload thanh toán phiếu nhập."""

from drf_spectacular.utils import OpenApiExample, inline_serializer
from rest_framework import serializers

from apps.purchase_orders.models import PurchaseOrderPaymentMethod

SubmitPaymentForm = inline_serializer(
    name="SubmitPaymentForm",
    fields={
        "payment_method": serializers.ChoiceField(
            choices=PurchaseOrderPaymentMethod.choices,
            help_text="Thường dùng `bank_transfer` khi quét VietQR",
        ),
        "receipt_file": serializers.FileField(
            help_text="Ảnh/PDF biên lai chuyển khoản — bắt buộc",
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
            help_text="Thời điểm CK — tùy chọn; không gửi thì server dùng thời gian hiện tại",
        ),
    },
)

SUBMIT_PAYMENT_MINIMAL_HELP = (
    "**Tối thiểu:** `payment_method` + `receipt_file`.\n\n"
    "`paid_at` không bắt buộc — backend tự gán nếu bỏ trống.\n"
    "Số tiền và loại (cọc/cuối) lấy từ phiếu, không gửi trong body."
)

SUBMIT_PAYMENT_EXAMPLE_NOTE = OpenApiExample(
    "Nộp biên lai (tối thiểu)",
    value={
        "payment_method": "bank_transfer",
    },
    request_only=True,
    description="Chọn file `receipt_file` trên Swagger — chỉ cần 2 field trên.",
)

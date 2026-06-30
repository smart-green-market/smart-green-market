"""Serializer phiếu nhập hàng — chuyển JSON/multipart ↔ model, gọi services khi tạo đơn.

- PurchaseOrderCreateSerializer : body POST tạo đơn → services.create_purchase_order
- PurchaseOrderDetailSerializer : response chi tiết (items, payments, status_histories)
- SubmitPaymentSerializer       : multipart nộp biên lai
- VerifyPaymentSerializer       : NCC duyệt/từ chối payment
"""

from decimal import Decimal

from rest_framework import serializers

from apps.accounts.models import AccountStatus
from apps.supplier_products.models import SupplierProduct
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from common.files import build_media_url
from common.openapi_enums import schema_choice_field
from common.return_summary import account_display_name, build_return_summary

from common.validators import require_rejection_reason

from .models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderPayment,
    PurchaseOrderPaymentMethod,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
    PurchaseOrderReturn,
    PurchaseOrderReturnItem,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
    PurchaseOrderStatusHistory,
)

class PurchaseOrderItemWriteSerializer(serializers.Serializer):
    supplier_product_id = serializers.IntegerField(
        help_text="ID từ `GET /api/supplier-products/` — backend tự nhóm theo NCC",
    )
    quantity = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
        help_text="Số lượng đặt (cùng đơn vị với sản phẩm)",
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Ghi chú cho dòng sản phẩm (tùy chọn)",
    )


class SupplierProductImageBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True, help_text="ID ảnh sản phẩm")
    image_url = serializers.SerializerMethodField(
        help_text="URL ảnh sản phẩm (đầy đủ)",
    )
    is_thumbnail = serializers.BooleanField(
        read_only=True,
        help_text="true = ảnh đại diện",
    )
    sort_order = serializers.IntegerField(
        read_only=True,
        help_text="Thứ tự hiển thị",
    )

    def get_image_url(self, obj):
        return build_media_url(obj.image_url, self.context.get("request"))


class PurchaseOrderItemReadSerializer(serializers.ModelSerializer):
    supplier_product_id = serializers.IntegerField(
        source="supplier_product.id",
        read_only=True,
        help_text="ID sản phẩm NCC",
    )
    product_name = serializers.CharField(
        source="supplier_product.name",
        read_only=True,
        help_text="Tên sản phẩm",
    )
    product_unit = serializers.CharField(
        source="supplier_product.unit",
        read_only=True,
        help_text="Đơn vị tính (kg, thùng...)",
    )
    product_thumbnail_url = serializers.SerializerMethodField(
        help_text="URL ảnh đại diện (is_thumbnail hoặc ảnh đầu tiên)",
    )
    product_images = SupplierProductImageBriefSerializer(
        source="supplier_product.images",
        many=True,
        read_only=True,
        help_text="Danh sách ảnh sản phẩm NCC",
    )
    daily_production_capacity = serializers.DecimalField(
        source="supplier_product.daily_production_capacity",
        max_digits=12,
        decimal_places=2,
        read_only=True,
        allow_null=True,
        help_text="Năng lực sản xuất TB/ngày của NCC (cảnh báo UI nếu quantity vượt)",
    )

    def get_product_thumbnail_url(self, obj):
        product = obj.supplier_product
        if not product:
            return None
        images = product.images.all()
        thumb = next((img for img in images if img.is_thumbnail), None)
        if thumb is None:
            thumb = images[0] if images else None
        if thumb is None:
            return None
        return build_media_url(thumb.image_url, self.context.get("request"))

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id",
            "supplier_product_id",
            "product_name",
            "product_unit",
            "product_thumbnail_url",
            "product_images",
            "daily_production_capacity",
            "quantity",
            "unit_price",
            "subtotal",
            "note",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID dòng sản phẩm"},
            "quantity": {"help_text": "Số lượng đặt"},
            "unit_price": {"help_text": "Đơn giá sỉ tại thời điểm tạo đơn (VND)"},
            "subtotal": {"help_text": "Thành tiền dòng = quantity × unit_price"},
            "note": {"help_text": "Ghi chú dòng sản phẩm"},
        }


class SupplierBankInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "bank_name",
            "bank_bin",
            "account_number",
            "account_name",
            "company_name",
        ]
        extra_kwargs = {
            "bank_name": {"help_text": "Tên ngân hàng (từ GET /api/banks/)"},
            "bank_bin": {"help_text": "Mã BIN Napas 6 số"},
            "account_number": {"help_text": "Số tài khoản nhận tiền của NCC"},
            "account_name": {"help_text": "Tên chủ tài khoản (không dấu, viết hoa)"},
            "company_name": {"help_text": "Tên công ty NCC"},
        }


class PaymentQrSerializer(serializers.Serializer):
    qr_image_url = serializers.URLField(
        help_text="URL ảnh QR VietQR (img.vietqr.io) — hiển thị cho dealer quét",
    )
    bank_bin = serializers.CharField(help_text="Mã BIN Napas của NCC")
    bank_name = serializers.CharField(help_text="Tên ngân hàng NCC")
    account_number = serializers.CharField(help_text="Số TK nhận tiền")
    account_name = serializers.CharField(help_text="Tên chủ TK")
    amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Số tiền cần chuyển (cọc hoặc phần còn lại)",
    )
    transfer_content = serializers.CharField(
        help_text="Nội dung chuyển khoản (mã đơn) — ghi đúng khi chuyển",
    )
    payment_type = schema_choice_field(choices=PurchaseOrderPaymentType.choices)
    order_id = serializers.IntegerField(help_text="ID phiếu nhập")
    order_code = serializers.CharField(help_text="Mã phiếu nhập (vd. PO-20250610-001)")
    template = serializers.CharField(
        help_text="Template VietQR (compact | compact2 | print | qr_only)",
    )


class PurchaseOrderPaymentReadSerializer(serializers.ModelSerializer):
    payment_method = schema_choice_field(
        choices=PurchaseOrderPaymentMethod.choices,
        read_only=True,
    )
    payment_type = schema_choice_field(
        choices=PurchaseOrderPaymentType.choices,
        read_only=True,
    )
    status = schema_choice_field(
        choices=PurchaseOrderPaymentStatus.choices,
        read_only=True,
    )
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
        help_text="Username admin/NCC đã xác minh",
    )

    class Meta:
        model = PurchaseOrderPayment
        fields = [
            "id",
            "payment_method",
            "payment_provider",
            "transaction_code",
            "amount",
            "payment_type",
            "status",
            "receipt_file",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "note",
            "paid_at",
            "created_at",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID lần thanh toán"},
            "payment_provider": {"help_text": "Tên ví/ngân hàng chuyển (nếu có)"},
            "transaction_code": {"help_text": "Mã giao dịch ngân hàng/ví"},
            "amount": {"help_text": "Số tiền thanh toán (VND)"},
            "receipt_file": {"help_text": "URL biên lai/chứng từ upload"},
            "verified_by": {"help_text": "ID tài khoản xác minh"},
            "verified_at": {"help_text": "Thời điểm xác minh"},
            "rejection_reason": {"help_text": "Lý do từ chối (nếu status=rejected)"},
            "note": {"help_text": "Ghi chú từ dealer khi nộp thanh toán"},
            "paid_at": {"help_text": "Thời điểm dealer thực hiện chuyển khoản"},
            "created_at": {"help_text": "Thời điểm tạo bản ghi thanh toán"},
        }


class PurchaseOrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(
        source="changed_by.username",
        read_only=True,
        allow_null=True,
        help_text="Username người thực hiện chuyển trạng thái",
    )

    class Meta:
        model = PurchaseOrderStatusHistory
        fields = [
            "id",
            "old_status",
            "new_status",
            "note",
            "changed_by",
            "changed_by_username",
            "created_at",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID bản ghi lịch sử"},
            "old_status": {"help_text": "Trạng thái trước khi chuyển"},
            "new_status": {"help_text": "Trạng thái sau khi chuyển"},
            "note": {"help_text": "Ghi chú kèm theo hành động"},
            "changed_by": {"help_text": "ID tài khoản thực hiện"},
            "created_at": {"help_text": "Thời điểm chuyển trạng thái"},
        }


class PurchaseOrderReturnItemReadSerializer(serializers.ModelSerializer):
    purchase_order_item_id = serializers.IntegerField(read_only=True)
    product_name = serializers.CharField(
        source="purchase_order_item.supplier_product.name",
        read_only=True,
    )

    class Meta:
        model = PurchaseOrderReturnItem
        fields = [
            "id",
            "purchase_order_item_id",
            "product_name",
            "quantity",
            "reason",
        ]


class PurchaseOrderReturnReadSerializer(serializers.ModelSerializer):
    status = schema_choice_field(choices=PurchaseOrderReturnStatus.choices, read_only=True)
    status_label = serializers.SerializerMethodField()
    items = PurchaseOrderReturnItemReadSerializer(many=True, read_only=True)
    evidence_file_url = serializers.SerializerMethodField()
    requested_by_username = serializers.CharField(
        source="requested_by.username",
        read_only=True,
        allow_null=True,
    )
    reviewed_by_username = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = PurchaseOrderReturn
        fields = [
            "id",
            "status",
            "status_label",
            "reason",
            "evidence_file",
            "evidence_file_url",
            "refund_amount",
            "requested_by",
            "requested_by_username",
            "reviewed_by",
            "reviewed_by_username",
            "review_note",
            "resolved_at",
            "created_at",
            "items",
        ]

    def get_status_label(self, obj):
        return dict(PurchaseOrderReturnStatus.choices).get(obj.status, obj.status)

    def get_evidence_file_url(self, obj):
        return build_media_url(obj.evidence_file, self.context.get("request"))


class PurchaseOrderCancelReturnDisplayMixin(serializers.Serializer):
    cancelled_by_name = serializers.SerializerMethodField()
    return_summary = serializers.SerializerMethodField()

    def get_cancelled_by_name(self, obj):
        return account_display_name(obj.cancelled_by)

    def get_return_summary(self, obj):
        returns = list(obj.returns.all())
        return build_return_summary(
            returns,
            order_status=obj.status,
            return_requested_order_status=PurchaseOrderStatus.RETURN_REQUESTED,
            pending_return_status=PurchaseOrderReturnStatus.REQUESTED,
            approved_return_status=PurchaseOrderReturnStatus.APPROVED,
            return_status_choices=PurchaseOrderReturnStatus.choices,
        )


class PurchaseOrderListSerializer(
    PurchaseOrderCancelReturnDisplayMixin,
    serializers.ModelSerializer,
):
    status = schema_choice_field(choices=PurchaseOrderStatus.choices, read_only=True)
    supplier_name = serializers.CharField(
        source="supplier.company_name",
        read_only=True,
        help_text="Tên công ty NCC",
    )
    dealer_name = serializers.CharField(
        source="dealer.store_name",
        read_only=True,
        help_text="Tên cửa hàng đại lý",
    )

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "order_code",
            "supplier",
            "supplier_name",
            "dealer",
            "dealer_name",
            "status",
            "total_amount",
            "deposit_amount",
            "paid_amount",
            "debt_amount",
            "requested_delivery_time",
            "confirmed_delivery_time",
            "cancelled_at",
            "cancel_reason",
            "cancelled_by_name",
            "return_summary",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID phiếu nhập"},
            "order_code": {"help_text": "Mã phiếu nhập duy nhất"},
            "supplier": {"help_text": "ID hồ sơ NCC"},
            "dealer": {"help_text": "ID hồ sơ đại lý"},
            "total_amount": {"help_text": "Tổng giá trị đơn (VND)"},
            "deposit_amount": {"help_text": "Số tiền cọc cần thanh toán (VND)"},
            "paid_amount": {"help_text": "Tổng tiền đã xác nhận thanh toán (VND)"},
            "debt_amount": {"help_text": "Số tiền còn phải thanh toán (VND)"},
            "requested_delivery_time": {
                "help_text": "Thời gian giao mong muốn của đại lý (tham khảo cho NCC)",
            },
            "confirmed_delivery_time": {
                "help_text": "Thời gian giao NCC cam kết (null trước khi confirm)",
            },
            "created_at": {"help_text": "Thời điểm tạo đơn"},
            "updated_at": {"help_text": "Thời điểm cập nhật gần nhất"},
        }


class PurchaseOrderDetailSerializer(
    PurchaseOrderCancelReturnDisplayMixin,
    serializers.ModelSerializer,
):
    status = schema_choice_field(choices=PurchaseOrderStatus.choices, read_only=True)
    items = PurchaseOrderItemReadSerializer(many=True, read_only=True)
    payments = PurchaseOrderPaymentReadSerializer(many=True, read_only=True)
    status_histories = PurchaseOrderStatusHistorySerializer(many=True, read_only=True)
    returns = PurchaseOrderReturnReadSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(
        source="supplier.company_name",
        read_only=True,
        help_text="Tên công ty NCC",
    )
    dealer_name = serializers.CharField(
        source="dealer.store_name",
        read_only=True,
        help_text="Tên cửa hàng đại lý",
    )
    supplier_bank = SupplierBankInfoSerializer(
        source="supplier",
        read_only=True,
        help_text="Thông tin TK ngân hàng NCC (dùng VietQR)",
    )
    dealer_phone = serializers.CharField(
        source="dealer.account.phone",
        read_only=True,
        help_text="SĐT đại lý",
    )
    dealer_email = serializers.CharField(
        source="dealer.account.email",
        read_only=True,
        help_text="Email đại lý",
    )
    supplier_phone = serializers.CharField(
        source="supplier.phone",
        read_only=True,
        help_text="SĐT NCC",
    )
    supplier_email = serializers.CharField(
        source="supplier.account.email",
        read_only=True,
        help_text="Email NCC",
    )

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "order_code",
            "supplier",
            "supplier_name",
            "supplier_bank",
            "dealer",
            "dealer_name",
            "dealer_phone",
            "dealer_email",
            "supplier_phone",
            "supplier_email",
            "status",
            "delivery_address",
            "requested_delivery_time",
            "confirmed_delivery_time",
            "receiver_name",
            "receiver_phone",
            "note",
            "rejection_reason",
            "total_amount",
            "deposit_percent",
            "deposit_amount",
            "paid_amount",
            "debt_amount",
            "confirmed_at",
            "delivered_at",
            "completed_at",
            "cancelled_at",
            "cancelled_by",
            "cancelled_by_name",
            "cancel_reason",
            "return_summary",
            "created_at",
            "updated_at",
            "items",
            "payments",
            "status_histories",
            "returns",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID phiếu nhập"},
            "order_code": {"help_text": "Mã phiếu nhập duy nhất"},
            "supplier": {"help_text": "ID hồ sơ NCC"},
            "dealer": {"help_text": "ID hồ sơ đại lý"},
            "delivery_address": {"help_text": "Địa chỉ nhận hàng"},
            "requested_delivery_time": {
                "help_text": "Thời gian giao mong muốn của đại lý (tham khảo cho NCC)",
            },
            "confirmed_delivery_time": {
                "help_text": "Thời gian giao NCC cam kết khi xác nhận phiếu",
            },
            "receiver_name": {"help_text": "Tên người nhận hàng"},
            "receiver_phone": {"help_text": "SĐT người nhận"},
            "note": {"help_text": "Ghi chú chung của đơn"},
            "rejection_reason": {"help_text": "Lý do NCC từ chối (nếu status=rejected)"},
            "total_amount": {"help_text": "Tổng giá trị đơn (VND)"},
            "deposit_percent": {"help_text": "Tỷ lệ cọc (%) — NCC xác nhận khi duyệt đơn"},
            "deposit_amount": {"help_text": "Số tiền cọc (VND)"},
            "paid_amount": {"help_text": "Tổng tiền đã xác nhận thanh toán (VND)"},
            "debt_amount": {"help_text": "Số tiền còn phải thanh toán (VND)"},
            "confirmed_at": {"help_text": "Thời điểm NCC xác nhận đơn"},
            "delivered_at": {"help_text": "Thời điểm đại lý xác nhận đã nhận hàng"},
            "completed_at": {"help_text": "Thời điểm hoàn tất (sau xác minh thanh toán cuối)"},
            "cancelled_at": {"help_text": "Thời điểm hủy phiếu"},
            "cancelled_by": {"help_text": "ID tài khoản hủy phiếu"},
            "cancel_reason": {"help_text": "Lý do hủy phiếu"},
            "created_at": {"help_text": "Thời điểm tạo đơn"},
            "updated_at": {"help_text": "Thời điểm cập nhật gần nhất"},
        }


class PurchaseOrderCreateSerializer(serializers.Serializer):
    supplier_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Không bắt buộc — bỏ trống khi giỏ có nhiều NCC",
    )
    delivery_address = serializers.CharField(
        help_text="Địa chỉ nhận hàng đầy đủ",
    )
    requested_delivery_time = serializers.DateTimeField(
        help_text=(
            "Thời gian giao mong muốn của đại lý (ISO 8601) — NCC tham khảo, "
            "có thể điều chỉnh khi confirm. "
            "Phải sau ít nhất `min_delivery_lead_days` ngày — xem GET /api/purchase-order-config/"
        ),
    )
    receiver_name = serializers.CharField(
        max_length=255,
        help_text="Tên người nhận hàng",
    )
    receiver_phone = serializers.CharField(
        max_length=20,
        help_text="Số điện thoại người nhận",
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Ghi chú chung cho đơn (tùy chọn)",
    )
    items = PurchaseOrderItemWriteSerializer(
        many=True,
        help_text="Giỏ hàng — có thể trộn SP nhiều NCC; mỗi NCC thành 1 phiếu riêng",
    )

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Cần ít nhất một sản phẩm.")
        return value

    def validate_supplier_id(self, value):
        if value is None:
            return None
        try:
            supplier = Supplier.objects.select_related("account").get(pk=value)
        except Supplier.DoesNotExist as exc:
            raise serializers.ValidationError("Nhà cung cấp không tồn tại.") from exc
        if supplier.verification_status != SupplierVerificationStatus.APPROVED:
            raise serializers.ValidationError("Nhà cung cấp chưa được duyệt.")
        if supplier.account.status != AccountStatus.ACTIVE:
            raise serializers.ValidationError("Tài khoản nhà cung cấp chưa active.")
        return value

    def create(self, validated_data):
        """Map supplier_product_id → SupplierProduct object rồi gọi create_purchase_order."""
        from . import services

        user = self.context["request"].user
        if not hasattr(user, "dealer_profile"):
            raise serializers.ValidationError({"detail": "Bạn cần có hồ sơ đại lý."})

        items_data = []
        for row in validated_data["items"]:
            try:
                product = SupplierProduct.objects.get(pk=row["supplier_product_id"])
            except SupplierProduct.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"items": f"Sản phẩm id={row['supplier_product_id']} không tồn tại."}
                ) from exc
            items_data.append(
                {
                    "supplier_product": product,
                    "quantity": row["quantity"],
                    "note": row.get("note", ""),
                }
            )

        delivery_data = {
            k: validated_data[k]
            for k in (
                "delivery_address",
                "requested_delivery_time",
                "receiver_name",
                "receiver_phone",
                "note",
            )
        }
        return services.create_purchase_orders(
            dealer_profile=user.dealer_profile,
            delivery_data=delivery_data,
            items_data=items_data,
            user=user,
            forced_supplier_id=validated_data.get("supplier_id"),
        )


class PurchaseOrderBatchCreateResponseSerializer(serializers.Serializer):
    orders = PurchaseOrderDetailSerializer(
        many=True,
        help_text="Mỗi phần tử = 1 phiếu / 1 NCC — xử lý luồng confirm/TT riêng theo `id`",
    )


class SupplierConfirmSerializer(serializers.Serializer):
    confirmed_delivery_time = serializers.DateTimeField(
        help_text=(
            "Ngày giờ giao NCC cam kết (ISO 8601). "
            "Có thể sớm hơn `requested_delivery_time`; "
            "muộn nhất = requested + `max_delivery_delay_days` — xem GET /api/purchase-order-config/"
        ),
    )
    deposit_percent = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        help_text=(
            "Tỷ lệ cọc (%). Mặc định `default_deposit_percent`; "
            "phải trong [min_deposit_percent, max_deposit_percent] — "
            "xem GET /api/purchase-order-config/"
        ),
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Ghi chú khi NCC xác nhận đơn",
    )


class SupplierRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(
        help_text="Lý do NCC từ chối đơn — bắt buộc",
    )


class SubmitPaymentSerializer(serializers.Serializer):
    payment_method = schema_choice_field(choices=PurchaseOrderPaymentMethod.choices)
    payment_provider = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Tên ngân hàng/ví (vd. Vietcombank, Momo) — tùy chọn",
    )
    transaction_code = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Mã giao dịch ngân hàng/ví — khuyến nghị khi chuyển khoản",
    )
    receipt_file = serializers.FileField(
        help_text="Ảnh/PDF biên lai chuyển khoản (multipart)",
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Ghi chú kèm thanh toán",
    )
    paid_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        default=None,
        help_text="Tùy chọn — không gửi thì server dùng thời gian hiện tại",
    )


class VerifyPaymentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField(
        help_text="ID bản ghi thanh toán cần xác minh (trong payments[])",
    )
    status = schema_choice_field(
        choices=[
            PurchaseOrderPaymentStatus.VERIFIED,
            PurchaseOrderPaymentStatus.REJECTED,
        ],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Bắt buộc khi status=rejected",
    )

    def validate(self, attrs):
        return require_rejection_reason(
            attrs,
            "status",
            "rejection_reason",
            {PurchaseOrderPaymentStatus.REJECTED},
        )


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(
        help_text="Lý do hủy đơn",
    )

    def validate_reason(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Vui lòng nhập lý do hủy.")
        return value


class PurchaseOrderReturnItemWriteSerializer(serializers.Serializer):
    purchase_order_item_id = serializers.IntegerField(help_text="ID dòng hàng muốn trả")
    quantity = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
        help_text="Số lượng trả",
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Lý do riêng cho dòng hàng",
    )


class RequestPurchaseOrderReturnSerializer(serializers.Serializer):
    reason = serializers.CharField(
        help_text="Lý do trả hàng chung",
    )
    items = PurchaseOrderReturnItemWriteSerializer(
        many=True,
        help_text="Danh sách dòng hàng và số lượng trả (có thể trả một phần)",
    )
    evidence_file = serializers.FileField(
        required=False,
        allow_empty_file=False,
        help_text="Ảnh/PDF bằng chứng nếu có",
    )

    def validate_reason(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Vui lòng nhập lý do trả hàng.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Phải chọn ít nhất một dòng hàng để trả.")
        seen: set[int] = set()
        for row in value:
            item_id = row["purchase_order_item_id"]
            if item_id in seen:
                raise serializers.ValidationError(
                    f"Trùng purchase_order_item_id={item_id} trong một yêu cầu."
                )
            seen.add(item_id)
        return value


class ReviewReturnSerializer(serializers.Serializer):
    approved = serializers.BooleanField(help_text="true = duyệt trả, false = từ chối")
    review_note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Ghi chú xử lý trả hàng",
    )

    def validate(self, attrs):
        if attrs.get("approved") is False and not attrs.get("review_note", "").strip():
            raise serializers.ValidationError(
                {"review_note": "Vui lòng nhập lý do từ chối trả hàng."}
            )
        return attrs


class NoteSerializer(serializers.Serializer):
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Ghi chú kèm hành động (vd. xác nhận giao hàng)",
    )

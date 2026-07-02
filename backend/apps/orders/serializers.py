"""Serializer đơn hàng buyer (B2C storefront)."""

from rest_framework import serializers

from apps.customers.models import CustomerAddress
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from common.files import build_media_url
from common.openapi_enums import schema_choice_field
from common.return_summary import account_display_name, build_return_summary

from . import services
from .delivery_slots import parse_delivery_slot, resolve_delivery_time
from .models import (
    CustomerPayment,
    CustomerPaymentMethod,
    CustomerPaymentStatus,
    CustomerPaymentType,
    Order,
    OrderItem,
    OrderReturn,
    OrderReturnItem,
    OrderReturnStatus,
    OrderStatus,
    OrderStatusHistory,
)


class OrderItemWriteSerializer(serializers.Serializer):
    dealer_product_id = serializers.IntegerField(
        help_text="ID sản phẩm đại lý (DealerProduct)",
    )
    quantity = serializers.IntegerField(
        min_value=1,
        help_text="Số lượng đặt",
    )


class OrderItemReadSerializer(serializers.ModelSerializer):
    dealer_product_id = serializers.IntegerField(
        source="dealer_product.id",
        read_only=True,
    )
    product_name = serializers.CharField(source="product_title", read_only=True)
    product_unit = serializers.CharField(source="unit", read_only=True)
    product_thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "dealer_product_id",
            "product_name",
            "product_unit",
            "product_thumbnail_url",
            "quantity",
            "unit_price",
            "subtotal",
        ]
        extra_kwargs = {
            "quantity": {"help_text": "Số lượng"},
            "unit_price": {"help_text": "Đơn giá bán lẻ tại thời điểm đặt (VND)"},
            "subtotal": {"help_text": "Thành tiền dòng"},
        }

    def get_product_thumbnail_url(self, obj):
        product = obj.dealer_product
        if not product:
            return None
        if product.thumbnail:
            return build_media_url(product.thumbnail, self.context.get("request"))
        images = product.images.all()
        thumb = next((img for img in images if img.is_thumbnail), None)
        if thumb is None and images:
            thumb = images[0]
        if thumb is None:
            return None
        return build_media_url(thumb.image_url, self.context.get("request"))


class CustomerPaymentReadSerializer(serializers.ModelSerializer):
    payment_method = schema_choice_field(
        choices=CustomerPaymentMethod.choices,
        read_only=True,
    )
    payment_type = schema_choice_field(
        choices=CustomerPaymentType.choices,
        read_only=True,
    )
    status = schema_choice_field(
        choices=CustomerPaymentStatus.choices,
        read_only=True,
    )

    class Meta:
        model = CustomerPayment
        fields = [
            "id",
            "payment_method",
            "payment_type",
            "amount",
            "status",
            "paid_at",
            "created_at",
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    status = schema_choice_field(choices=OrderStatus.choices, source="new_status", read_only=True)
    label = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = ["id", "status", "label", "old_status", "new_status", "note", "changed_by_name", "created_at"]

    def get_changed_by_name(self, obj):
        if obj.changed_by is None:
            return None
        return obj.changed_by.full_name or obj.changed_by.username

    def get_label(self, obj):
        return dict(OrderStatus.choices).get(obj.new_status, obj.new_status)


class OrderReturnItemReadSerializer(serializers.ModelSerializer):
    order_item_id = serializers.IntegerField(read_only=True)
    product_name = serializers.CharField(source="order_item.product_title", read_only=True)

    class Meta:
        model = OrderReturnItem
        fields = ["id", "order_item_id", "product_name", "quantity", "reason"]


class OrderReturnReadSerializer(serializers.ModelSerializer):
    status = schema_choice_field(choices=OrderReturnStatus.choices, read_only=True)
    status_label = serializers.SerializerMethodField()
    items = OrderReturnItemReadSerializer(many=True, read_only=True)
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
        model = OrderReturn
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
        return dict(OrderReturnStatus.choices).get(obj.status, obj.status)

    def get_evidence_file_url(self, obj):
        return build_media_url(obj.evidence_file, self.context.get("request"))


class OrderCancelReturnDisplayMixin(serializers.Serializer):
    """Field hiển thị hủy / trả hàng trên list & detail."""

    cancelled_by_name = serializers.SerializerMethodField()
    return_summary = serializers.SerializerMethodField()

    def get_cancelled_by_name(self, obj):
        return account_display_name(obj.cancelled_by)

    def get_return_summary(self, obj):
        returns = list(obj.returns.all())
        return build_return_summary(
            returns,
            order_status=obj.status,
            return_requested_order_status=OrderStatus.RETURN_REQUESTED,
            pending_return_status=OrderReturnStatus.REQUESTED,
            approved_return_status=OrderReturnStatus.APPROVED,
            return_status_choices=OrderReturnStatus.choices,
        )


class OrderDeliveryInfoMixin:
    """Helper methods — delivery_date/slot fields khai báo trên từng ModelSerializer."""

    def _delivery_slot_info(self, obj):
        cached = getattr(obj, "_delivery_slot_info_cache", None)
        if cached is not None:
            return cached
        info = parse_delivery_slot(obj.delivery_time)
        obj._delivery_slot_info_cache = info
        return info

    def get_delivery_date(self, obj):
        info = self._delivery_slot_info(obj)
        return info["delivery_date"] if info else None

    def get_delivery_slot(self, obj):
        info = self._delivery_slot_info(obj)
        return info["delivery_slot"] if info else None

    def get_delivery_slot_name(self, obj):
        info = self._delivery_slot_info(obj)
        return info["delivery_slot_name"] if info else None


class OrderListSerializer(
    OrderDeliveryInfoMixin,
    OrderCancelReturnDisplayMixin,
    serializers.ModelSerializer,
):
    status = schema_choice_field(choices=OrderStatus.choices, read_only=True)
    dealer_name = serializers.CharField(source="dealer.store_name", read_only=True)
    customer_name = serializers.CharField(source="customer.user.full_name", read_only=True)
    payment_method = serializers.SerializerMethodField()
    item_count = serializers.IntegerField(read_only=True)
    delivery_date = serializers.SerializerMethodField(read_only=True)
    delivery_slot = serializers.SerializerMethodField(read_only=True)
    delivery_slot_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "dealer_name",
            "customer_name",
            "payment_method",
            "subtotal_amount",
            "discount_amount",
            "shipping_fee",
            "total_amount",
            "paid_amount",
            "debt_amount",
            "item_count",
            "delivery_time",
            "delivery_date",
            "delivery_slot",
            "delivery_slot_name",
            "cancelled_at",
            "cancel_reason",
            "cancelled_by_name",
            "return_summary",
            "created_at",
        ]

    def get_payment_method(self, obj):
        payment = obj.payments.order_by("-id").first()
        if not payment:
            return None
        if payment.payment_type == CustomerPaymentType.COD:
            return "Thanh toán khi nhận hàng (COD)"
        return dict(CustomerPaymentMethod.choices).get(
            payment.payment_method,
            payment.payment_method,
        )


class OrderDetailSerializer(
    OrderDeliveryInfoMixin,
    OrderCancelReturnDisplayMixin,
    serializers.ModelSerializer,
):
    status = schema_choice_field(choices=OrderStatus.choices, read_only=True)
    dealer_name = serializers.CharField(source="dealer.store_name", read_only=True)
    customer_name = serializers.CharField(source="customer.user.full_name", read_only=True)
    customer_phone = serializers.CharField(source="customer.user.phone", read_only=True)
    payment_method = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()
    delivery_date = serializers.SerializerMethodField(read_only=True)
    delivery_slot = serializers.SerializerMethodField(read_only=True)
    delivery_slot_name = serializers.SerializerMethodField(read_only=True)
    items = OrderItemReadSerializer(many=True, read_only=True)
    payments = CustomerPaymentReadSerializer(many=True, read_only=True)
    status_histories = OrderStatusHistorySerializer(many=True, read_only=True)
    returns = OrderReturnReadSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "dealer_name",
            "customer_name",
            "customer_phone",
            "payment_method",
            "receiver_name",
            "receiver_phone",
            "delivery_address",
            "delivery_time",
            "delivery_date",
            "delivery_slot",
            "delivery_slot_name",
            "note",
            "shipping_address",
            "subtotal_amount",
            "discount_amount",
            "shipping_fee",
            "total_amount",
            "paid_amount",
            "debt_amount",
            "items",
            "payments",
            "status_histories",
            "returns",
            "delivered_at",
            "completed_at",
            "cancelled_at",
            "cancelled_by",
            "cancelled_by_name",
            "cancel_reason",
            "return_summary",
            "created_at",
            "updated_at",
        ]

    def get_payment_method(self, obj):
        payment = obj.payments.order_by("-id").first()
        if not payment:
            return None
        if payment.payment_type == CustomerPaymentType.COD:
            return "Thanh toán khi nhận hàng (COD)"
        return dict(CustomerPaymentMethod.choices).get(
            payment.payment_method,
            payment.payment_method,
        )

    def get_shipping_address(self, obj):
        return {
            "receiver": obj.receiver_name,
            "phone": obj.receiver_phone,
            "detail": obj.delivery_address,
        }


class DeliverySlotOptionSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    start_time = serializers.CharField()
    end_time = serializers.CharField()
    available = serializers.BooleanField()
    delivery_time = serializers.CharField(allow_null=True)


class DeliverySlotDateSerializer(serializers.Serializer):
    date = serializers.CharField()
    slots = DeliverySlotOptionSerializer(many=True)


class DeliverySlotDefinitionSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    start_time = serializers.CharField()
    end_time = serializers.CharField()


class DeliverySlotsResponseSerializer(serializers.Serializer):
    timezone = serializers.CharField()
    min_lead_hours = serializers.IntegerField()
    morning_cutoff_hour = serializers.IntegerField()
    max_booking_days = serializers.IntegerField()
    slots = DeliverySlotDefinitionSerializer(many=True)
    generated_at = serializers.CharField()
    dates = DeliverySlotDateSerializer(many=True)


class OrderCreateSerializer(serializers.Serializer):
    """Body POST tạo đơn buyer — COD, khung giờ giao qua delivery_date + delivery_slot."""

    items = OrderItemWriteSerializer(
        many=True,
        help_text="Danh sách sản phẩm đặt mua (ít nhất 1 dòng)",
    )
    customer_address_id = serializers.IntegerField(
        help_text="ID địa chỉ nhận hàng đã lưu (`GET .../addresses/`)",
    )
    delivery_date = serializers.DateField(
        help_text=(
            "Ngày giao hàng (YYYY-MM-DD). Lấy từ field `date` trong "
            "`GET .../delivery-slots/` — chỉ chọn ngày có slot `available: true`."
        ),
    )
    delivery_slot = schema_choice_field(
        choices=[("morning", "Sáng"), ("afternoon", "Chiều")],
        help_text=(
            "Khung giờ: `morning` (07:00) hoặc `afternoon` (16:00). "
            "Lấy từ field `id` của slot đã chọn trong delivery-slots."
        ),
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")
    voucher_code = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Đơn hàng phải có ít nhất một sản phẩm.")
        return value

    def validate(self, attrs):
        attrs["delivery_time"] = resolve_delivery_time(
            attrs["delivery_date"],
            attrs["delivery_slot"],
        )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        dealer = self.context["dealer"]
        customer = request.user.customer_profile

        product_ids = [row["dealer_product_id"] for row in validated_data["items"]]
        products = {
            p.id: p
            for p in DealerProduct.objects.filter(
                id__in=product_ids,
                dealer_profile=dealer,
                status=DealerProductStatus.ACTIVE,
            )
        }
        items_data = []
        for row in validated_data["items"]:
            product = products.get(row["dealer_product_id"])
            if product is None:
                raise serializers.ValidationError(
                    {"items": f"Sản phẩm #{row['dealer_product_id']} không hợp lệ."}
                )
            items_data.append({"dealer_product": product, "quantity": row["quantity"]})

        return services.create_customer_order(
            dealer=dealer,
            customer=customer,
            customer_address_id=validated_data["customer_address_id"],
            delivery_time=validated_data["delivery_time"],
            note=validated_data.get("note", ""),
            items_data=items_data,
            voucher_code=validated_data.get("voucher_code", ""),
            user=request.user,
        )


class NoteSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default="")


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(help_text="Lý do hủy đơn")

    def validate_reason(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Vui lòng nhập lý do hủy.")
        return value


class OrderReturnItemWriteSerializer(serializers.Serializer):
    order_item_id = serializers.IntegerField(help_text="ID dòng hàng muốn trả")
    quantity = serializers.IntegerField(min_value=1, help_text="Số lượng trả")
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Lý do riêng cho dòng hàng",
    )


class RequestOrderReturnSerializer(serializers.Serializer):
    reason = serializers.CharField(
        help_text="Lý do trả hàng — trả toàn bộ đơn, không chọn số lượng",
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

"""Serializer YC đặt trước B2C."""

from rest_framework import serializers

from apps.dealer_products.models import DealerProduct, DealerProductStatus
from common.openapi_enums import schema_choice_field

from . import preorder_services
from .delivery_slots import resolve_delivery_time
from .models import PreOrderRequest, PreOrderRequestItem, PreOrderRequestStatus


class CheckStockItemSerializer(serializers.Serializer):
    dealer_product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CheckStockResultSerializer(serializers.Serializer):
    dealer_product_id = serializers.IntegerField()
    requested_quantity = serializers.IntegerField()
    available_quantity = serializers.IntegerField()
    shortfall = serializers.IntegerField()
    can_order_available = serializers.BooleanField()
    needs_preorder = serializers.BooleanField()
    order_available_quantity = serializers.IntegerField()


class CheckStockRequestSerializer(serializers.Serializer):
    items = CheckStockItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Danh sách sản phẩm không được rỗng.")
        return value


class PreOrderRequestItemReadSerializer(serializers.ModelSerializer):
    dealer_product_id = serializers.IntegerField(source="dealer_product.id", read_only=True)

    class Meta:
        model = PreOrderRequestItem
        fields = [
            "id",
            "dealer_product_id",
            "product_title",
            "unit",
            "requested_quantity",
            "available_at_submit",
            "confirmed_quantity",
            "proposed_quantity",
        ]


class PreOrderRequestListSerializer(serializers.ModelSerializer):
    status = schema_choice_field(choices=PreOrderRequestStatus.choices, read_only=True)
    status_label = serializers.SerializerMethodField()
    item_count = serializers.IntegerField(source="items.count", read_only=True)
    converted_order_id = serializers.IntegerField(
        source="converted_order.id",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = PreOrderRequest
        fields = [
            "id",
            "request_code",
            "status",
            "status_label",
            "requested_delivery_time",
            "confirmed_delivery_time",
            "proposed_delivery_time",
            "item_count",
            "converted_order_id",
            "created_at",
        ]

    def get_status_label(self, obj):
        return dict(PreOrderRequestStatus.choices).get(obj.status, obj.status)


class PreOrderRequestDetailSerializer(PreOrderRequestListSerializer):
    items = PreOrderRequestItemReadSerializer(many=True, read_only=True)
    receiver_name = serializers.CharField(read_only=True)
    receiver_phone = serializers.CharField(read_only=True)
    delivery_address = serializers.CharField(read_only=True)
    note = serializers.CharField(read_only=True)
    dealer_note = serializers.CharField(read_only=True)
    reject_reason = serializers.CharField(read_only=True)

    class Meta(PreOrderRequestListSerializer.Meta):
        fields = PreOrderRequestListSerializer.Meta.fields + [
            "receiver_name",
            "receiver_phone",
            "delivery_address",
            "note",
            "dealer_note",
            "reject_reason",
            "items",
        ]


class PreOrderRequestCreateSerializer(serializers.Serializer):
    items = CheckStockItemSerializer(many=True)
    customer_address_id = serializers.IntegerField()
    delivery_date = serializers.DateField()
    delivery_slot = schema_choice_field(
        choices=[("morning", "Sáng"), ("afternoon", "Chiều")],
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")

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

        return preorder_services.create_preorder_request(
            dealer=dealer,
            customer=customer,
            customer_address_id=validated_data["customer_address_id"],
            delivery_time=validated_data["delivery_time"],
            note=validated_data.get("note", ""),
            items_data=items_data,
            user=request.user,
        )


class PreOrderProposeSerializer(serializers.Serializer):
    proposed_delivery_date = serializers.DateField(required=False)
    proposed_delivery_slot = schema_choice_field(
        choices=[("morning", "Sáng"), ("afternoon", "Chiều")],
        required=False,
    )
    item_quantities = serializers.DictField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        help_text="Map preorder_item_id → số lượng đề xuất",
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        date_val = attrs.get("proposed_delivery_date")
        slot_val = attrs.get("proposed_delivery_slot")
        if date_val and slot_val:
            attrs["proposed_delivery_time"] = resolve_delivery_time(date_val, slot_val)
        elif date_val or slot_val:
            raise serializers.ValidationError(
                "Cần gửi cả proposed_delivery_date và proposed_delivery_slot."
            )
        return attrs


class PreOrderRejectSerializer(serializers.Serializer):
    reason = serializers.CharField()

    def validate_reason(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Vui lòng nhập lý do.")
        return value


class PreOrderNoteSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default="")

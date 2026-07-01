# promotions/serializers.py
from rest_framework import serializers
from apps.promotions.models import Promotion, PromotionTarget


class AvailablePromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = [
            "id", "code", "title", "description",
            "discount_type", "discount_value",
            "start_date", "end_date",
        ]


class PromotionTargetSerializer(serializers.ModelSerializer):
    target_type = serializers.ChoiceField(
        choices=[("segment", "Theo nhóm khách")],
        default="segment",
        help_text="Loại đối tượng áp dụng. Chỉ hỗ trợ 'segment'.",
    )

    class Meta:
        model = PromotionTarget
        fields = [
            "id",
            "target_type",
            "segment",
        ]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if "segment" in data:
            val = data["segment"]
            if val == "" or val == 0 or val == "0" or val is None:
                data["segment"] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        target_type = attrs.get("target_type")
        segment = attrs.get("segment")

        if target_type != "segment":
            raise serializers.ValidationError({"target_type": "Chỉ chấp nhận đối tượng áp dụng là phân nhóm khách hàng (segment)."})

        if segment is None:
            raise serializers.ValidationError({"segment": "Trường segment không được để trống khi target_type là 'segment'."})

        return attrs


class PromotionSerializer(serializers.ModelSerializer):
    targets = PromotionTargetSerializer(many=True, required=False)

    class Meta:
        model = Promotion
        fields = [
            "id",
            "dealer",
            "created_by",
            "title",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "min_order_amount",
            "max_discount_amount",
            "usage_limit",
            "usage_limit_per_customer",
            "start_date",
            "end_date",
            "status",
            "reject_reason",
            "targets",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "dealer", "created_by", "status", "reject_reason", "created_at", "updated_at"]

    def validate_code(self, value):
        if value:
            # Loại bỏ khoảng trắng ở hai đầu
            value = value.strip()
            # Tự động viết hoa để tránh trùng lặp do phân biệt chữ hoa chữ thường
            value = value.upper()
            import re
            if not re.match(r'^[A-Z0-9_-]+$', value):
                raise serializers.ValidationError(
                    "Mã voucher chỉ được chứa chữ cái không dấu (A-Z), chữ số, dấu gạch ngang (-) và gạch dưới (_), không chứa khoảng trắng."
                )
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("start_date phải trước end_date")

        # Kiểm tra tính duy nhất của mã voucher cho từng đại lý (UniqueConstraint)
        code = attrs.get("code")
        if code:
            request = self.context.get("request")
            dealer = None
            if self.instance:
                dealer = self.instance.dealer
            elif request and request.user and hasattr(request.user, "dealer_profile"):
                dealer = request.user.dealer_profile

            query = Promotion.objects.filter(dealer=dealer, code=code)
            if self.instance:
                query = query.exclude(id=self.instance.id)

            if query.exists():
                raise serializers.ValidationError({"code": "Mã voucher này đã tồn tại trong gian hàng của bạn."})

        return attrs

    def create(self, validated_data):
        targets_data = validated_data.pop("targets", [])
        request = self.context.get("request")
        
        # Determine dealer from request context
        if request and request.user:
            if hasattr(request.user, "dealer_profile"):
                validated_data["dealer"] = request.user.dealer_profile
            validated_data["created_by"] = request.user

        promotion = Promotion.objects.create(**validated_data)
        for target_data in targets_data:
            PromotionTarget.objects.create(promotion=promotion, **target_data)
        return promotion

    def update(self, instance, validated_data):
        targets_data = validated_data.pop("targets", None)
        
        # Update promotion fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update targets if provided
        if targets_data is not None:
            instance.targets.all().delete()
            for target_data in targets_data:
                PromotionTarget.objects.create(promotion=instance, **target_data)
        return instance


class VerifyPromotionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["active", "rejected"],
        help_text="Trạng thái phê duyệt: active (Duyệt) hoặc rejected (Từ chối)"
    )
    reject_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Lý do từ chối duyệt (bắt buộc khi status = rejected)"
    )

    def validate(self, attrs):
        status = attrs.get("status")
        reject_reason = attrs.get("reject_reason")
        if status == "rejected" and not reject_reason:
            raise serializers.ValidationError({"reject_reason": "Bắt buộc phải nhập lý do từ chối."})
        return attrs


class ApplyVoucherSerializer(serializers.Serializer):
    """Serializer cho request body của /api/vouchers/apply/"""
    promotion_id = serializers.IntegerField(required=True, help_text="ID của voucher cần áp dụng")
    order_id = serializers.IntegerField(required=False, allow_null=True, help_text="ID đơn hàng (nếu đã tạo)")
    order_total = serializers.DecimalField(
        required=True, max_digits=14, decimal_places=2,
        help_text="Tổng giá trị đơn hàng (VND)"
    )


class CartItemSerializer(serializers.Serializer):
    dealer_product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)


class CartApplyVoucherSerializer(serializers.Serializer):
    voucher_code = serializers.CharField(required=True)
    items = CartItemSerializer(many=True, required=True)

    def validate_voucher_code(self, value):
        if value:
            # Loại bỏ khoảng trắng ở hai đầu
            value = value.strip()
            # Tự động viết hoa để so khớp chính xác với DB
            value = value.upper()
            import re
            if not re.match(r'^[A-Z0-9_-]+$', value):
                raise serializers.ValidationError(
                    "Mã voucher chỉ được chứa chữ cái không dấu (A-Z), chữ số, dấu gạch ngang (-) và gạch dưới (_), không chứa khoảng trắng."
                )
        return value


class CartVoucherResponseDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    title = serializers.CharField()
    discount_type = serializers.CharField()
    discount_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    min_order_amount = serializers.DecimalField(max_digits=14, decimal_places=2)


class CartApplyVoucherResponseSerializer(serializers.Serializer):
    voucher = CartVoucherResponseDetailSerializer()
    order_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    discount_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    final_total = serializers.DecimalField(max_digits=14, decimal_places=2)

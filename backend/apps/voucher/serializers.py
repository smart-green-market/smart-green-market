# promotions/serializers.py
from decimal import Decimal
from django.db import IntegrityError
from rest_framework import serializers
from apps.promotions.models import (
    CustomerSavedVoucher,
    Promotion,
    PromotionScheduleType,
    PromotionTarget,
    PromotionDiscountType,
)


class VoucherDecimalField(serializers.DecimalField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('max_digits', 14)
        kwargs.setdefault('decimal_places', 2)
        super().__init__(*args, **kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        if not isinstance(value, Decimal):
            try:
                value = Decimal(str(value))
            except Exception:
                return super().to_representation(value)
        normalized = value.normalize()
        if normalized == normalized.to_integral_value():
            return int(normalized)
        return float(normalized)


class AvailablePromotionSerializer(serializers.ModelSerializer):
    is_saved = serializers.SerializerMethodField()
    discount_value = VoucherDecimalField(read_only=True)
    min_order_amount = VoucherDecimalField(read_only=True)
    max_discount_amount = VoucherDecimalField(read_only=True)

    class Meta:
        model = Promotion
        fields = [
            "id", "code", "title", "description",
            "discount_type", "discount_value",
            "min_order_amount", "max_discount_amount",
            "usage_limit", "usage_limit_per_customer",
            "start_date", "end_date", "schedule_type",
            "daily_start_time", "daily_end_time", "is_saved",
        ]

    def get_is_saved(self, obj):
        saved_ids = self.context.get("saved_promotion_ids", set())
        return obj.id in saved_ids


class SavedPromotionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="promotion.id", read_only=True)
    code = serializers.CharField(source="promotion.code", read_only=True)
    title = serializers.CharField(source="promotion.title", read_only=True)
    description = serializers.CharField(source="promotion.description", read_only=True)
    discount_type = serializers.CharField(source="promotion.discount_type", read_only=True)
    discount_value = VoucherDecimalField(
        source="promotion.discount_value",
        read_only=True,
    )
    min_order_amount = VoucherDecimalField(
        source="promotion.min_order_amount",
        read_only=True,
    )
    max_discount_amount = VoucherDecimalField(
        source="promotion.max_discount_amount",
        read_only=True,
    )
    start_date = serializers.DateTimeField(source="promotion.start_date", read_only=True)
    end_date = serializers.DateTimeField(source="promotion.end_date", read_only=True)
    schedule_type = serializers.CharField(source="promotion.schedule_type", read_only=True)
    daily_start_time = serializers.TimeField(source="promotion.daily_start_time", read_only=True)
    daily_end_time = serializers.TimeField(source="promotion.daily_end_time", read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = CustomerSavedVoucher
        fields = [
            "id", "code", "title", "description",
            "discount_type", "discount_value",
            "min_order_amount", "max_discount_amount",
            "start_date", "end_date", "schedule_type",
            "daily_start_time", "daily_end_time", "is_saved", "saved_at",
        ]

    def get_is_saved(self, obj):
        return True


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
    title = serializers.CharField(
        error_messages={
            "blank": "Tiêu đề voucher không được để trống.",
            "required": "Tiêu đề voucher không được để trống.",
        }
    )
    # ĐÃ BỎ UniqueValidator ở đây — check trùng code được xử lý tập trung
    # trong validate() bên dưới (dùng đúng giá trị đã chuẩn hóa .strip().upper())
    code = serializers.CharField(
        error_messages={
            "blank": "Mã voucher không được để trống.",
            "required": "Mã voucher không được để trống.",
        }
    )
    discount_type = serializers.ChoiceField(
        choices=PromotionDiscountType.choices,
        error_messages={
            "invalid_choice": "Loại giảm giá không hợp lệ.",
            "required": "Vui lòng chọn loại giảm giá.",
        }
    )
    discount_value = VoucherDecimalField(
        required=True,
        error_messages={
            "invalid": "Mức giảm giá phải là số hợp lệ.",
            "required": "Vui lòng nhập mức giảm giá.",
        }
    )
    min_order_amount = VoucherDecimalField(
        required=False,
        default=0,
        error_messages={
            "invalid": "Giá trị đơn hàng tối thiểu phải là số hợp lệ.",
        }
    )
    max_discount_amount = VoucherDecimalField(
        required=False,
        allow_null=True,
        error_messages={
            "invalid": "Mức giảm tối đa phải là số hợp lệ.",
        }
    )
    start_date = serializers.DateTimeField(
        required=True,
        error_messages={
            "invalid": "Ngày bắt đầu không đúng định dạng.",
            "required": "Vui lòng chọn ngày bắt đầu.",
        }
    )
    end_date = serializers.DateTimeField(
        required=True,
        error_messages={
            "invalid": "Ngày kết thúc không đúng định dạng.",
            "required": "Vui lòng chọn ngày kết thúc.",
        }
    )
    usage_limit = serializers.IntegerField(
        required=False,
        allow_null=True,
        error_messages={
            "invalid": "Giới hạn sử dụng phải là số nguyên hợp lệ.",
        }
    )
    usage_limit_per_customer = serializers.IntegerField(
        required=False,
        allow_null=True,
        error_messages={
            "invalid": "Giới hạn sử dụng trên mỗi khách hàng phải là số nguyên hợp lệ.",
        }
    )

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
            "schedule_type",
            "daily_start_time",
            "daily_end_time",
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
        schedule_type = attrs.get(
            "schedule_type",
            getattr(self.instance, "schedule_type", PromotionScheduleType.DATE_RANGE),
        )
        daily_start_time = attrs.get(
            "daily_start_time",
            getattr(self.instance, "daily_start_time", None),
        )
        daily_end_time = attrs.get(
            "daily_end_time",
            getattr(self.instance, "daily_end_time", None),
        )
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({"start_date": "Ngày bắt đầu phải trước ngày kết thúc."})
        if schedule_type == PromotionScheduleType.DAILY_TIME:
            if daily_start_time is None or daily_end_time is None:
                raise serializers.ValidationError({
                    "daily_start_time": "Bắt buộc nhập giờ bắt đầu khi voucher lặp hằng ngày.",
                    "daily_end_time": "Bắt buộc nhập giờ kết thúc khi voucher lặp hằng ngày.",
                })
            if daily_start_time == daily_end_time:
                raise serializers.ValidationError({
                    "daily_end_time": "Giờ kết thúc phải khác giờ bắt đầu.",
                })

        # Kiểm tra tính duy nhất của mã voucher — code có unique=True TOÀN CỤC ở model,
        # nên phải check global (không chỉ theo dealer) để khớp với constraint thật ở DB.
        code = attrs.get("code")
        if code:
            global_query = Promotion.objects.filter(code=code)
            if self.instance:
                global_query = global_query.exclude(id=self.instance.id)

            if global_query.exists():
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

        try:
            promotion = Promotion.objects.create(**validated_data)
        except IntegrityError:
            # Lưới an toàn cuối cùng cho race condition (2 request tạo cùng lúc)
            raise serializers.ValidationError({
                "code": ["Mã voucher này đã tồn tại, vui lòng chọn mã khác."]
            })

        for target_data in targets_data:
            PromotionTarget.objects.create(promotion=promotion, **target_data)
        return promotion

    def update(self, instance, validated_data):
        targets_data = validated_data.pop("targets", None)

        # Update promotion fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        try:
            instance.save()
        except IntegrityError:
            raise serializers.ValidationError({
                "code": ["Mã voucher này đã tồn tại, vui lòng chọn mã khác."]
            })

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
    discount_value = VoucherDecimalField()
    min_order_amount = VoucherDecimalField()


class CartApplyVoucherResponseSerializer(serializers.Serializer):
    voucher = CartVoucherResponseDetailSerializer()
    order_total = VoucherDecimalField()
    discount_amount = VoucherDecimalField()
    final_total = VoucherDecimalField()
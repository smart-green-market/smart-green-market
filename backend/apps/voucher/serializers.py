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
    PromotionTargetType,
    VoucherAudienceType,
    PRODUCT_TARGET_TYPES,
)
from apps.marketing.models import CustomerSegment
from apps.loyalty.models import LoyaltyTier

from .audience_sync import (
    extract_segment_ids_from_legacy_targets,
    sync_promotion_audience,
    sync_promotion_product_targets,
)
from .audience_validation import validate_audience_payload


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


class VoucherLoyaltyTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTier
        fields = ["id", "code", "name"]


class VoucherCustomerSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerSegment
        fields = ["id", "code", "name"]


class ProductScopeTargetSerializer(serializers.ModelSerializer):
    """Phạm vi sản phẩm/danh mục — tách khỏi audience khách hàng."""

    target_type = serializers.ChoiceField(
        choices=[
            (PromotionTargetType.PRODUCT, "Theo sản phẩm đại lý"),
            (PromotionTargetType.CATEGORY, "Theo danh mục"),
        ],
    )

    class Meta:
        model = PromotionTarget
        fields = [
            "id",
            "target_type",
            "dealer_product",
            "category",
        ]

    def validate(self, attrs):
        target_type = attrs.get("target_type")
        dealer_product = attrs.get("dealer_product")
        category = attrs.get("category")

        if target_type == PromotionTargetType.PRODUCT and dealer_product is None:
            raise serializers.ValidationError(
                {"dealer_product": "Bắt buộc khi target_type là product."}
            )
        if target_type == PromotionTargetType.CATEGORY and category is None:
            raise serializers.ValidationError(
                {"category": "Bắt buộc khi target_type là category."}
            )
        if target_type == PromotionTargetType.CUSTOMER:
            raise serializers.ValidationError(
                {"target_type": "Không hỗ trợ tạo voucher theo một khách hàng cụ thể."}
            )
        return attrs


class PromotionSerializer(serializers.ModelSerializer):
    product_targets = ProductScopeTargetSerializer(many=True, required=False)
    loyalty_tier_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    customer_segment_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    loyalty_tiers = VoucherLoyaltyTierSerializer(many=True, read_only=True)
    customer_segments = serializers.SerializerMethodField()
    targets = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="Tương thích cũ: chỉ normalize segment sang customer_segment_ids.",
    )
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
            "audience_type",
            "loyalty_tier_ids",
            "customer_segment_ids",
            "loyalty_tiers",
            "customer_segments",
            "product_targets",
            "targets",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "dealer",
            "created_by",
            "status",
            "reject_reason",
            "loyalty_tiers",
            "customer_segments",
            "created_at",
            "updated_at",
        ]

    def get_customer_segments(self, obj):
        segments = CustomerSegment.objects.filter(
            promotion_targets__promotion=obj,
            promotion_targets__target_type=PromotionTargetType.SEGMENT,
        ).distinct()
        return VoucherCustomerSegmentSerializer(segments, many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        product_qs = instance.targets.filter(target_type__in=PRODUCT_TARGET_TYPES)
        data["product_targets"] = ProductScopeTargetSerializer(
            product_qs,
            many=True,
        ).data
        return data

    def _resolve_dealer(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if user and hasattr(user, "dealer_profile"):
            return user.dealer_profile
        return validated_data.get("dealer") or getattr(self.instance, "dealer", None)

    def _parse_audience_inputs(self, attrs):
        legacy_targets = attrs.pop("targets", None) or []
        loyalty_tier_ids = attrs.pop("loyalty_tier_ids", None)
        customer_segment_ids = attrs.pop("customer_segment_ids", None)
        product_targets = attrs.pop("product_targets", None)

        has_customer_target = False
        for row in legacy_targets:
            if row.get("target_type") == PromotionTargetType.CUSTOMER:
                has_customer_target = True
            if row.get("target_type") in PRODUCT_TARGET_TYPES:
                raise serializers.ValidationError(
                    {
                        "targets": [
                            "Dùng product_targets cho phạm vi sản phẩm, không gửi qua targets."
                        ]
                    }
                )

        if customer_segment_ids is None and legacy_targets:
            extracted = extract_segment_ids_from_legacy_targets(legacy_targets)
            if extracted:
                customer_segment_ids = extracted

        return {
            "loyalty_tier_ids": loyalty_tier_ids,
            "customer_segment_ids": customer_segment_ids,
            "product_targets": product_targets,
            "reject_customer_target": has_customer_target,
        }

    def _audience_fields_in_request(self):
        if not hasattr(self, "initial_data"):
            return False
        return any(
            key in self.initial_data
            for key in (
                "audience_type",
                "loyalty_tier_ids",
                "customer_segment_ids",
                "targets",
            )
        )

    def _validate_and_prepare_audience(self, attrs, audience_inputs, *, is_partial_update=False):
        audience_type = attrs.get("audience_type")
        if audience_type is None and self.instance:
            audience_type = self.instance.audience_type
        elif audience_type is None:
            audience_type = VoucherAudienceType.ALL

        loyalty_tier_ids = audience_inputs.get("loyalty_tier_ids")
        customer_segment_ids = audience_inputs.get("customer_segment_ids")

        if is_partial_update and self.instance:
            if (
                audience_type == VoucherAudienceType.LOYALTY_TIER
                and loyalty_tier_ids is None
            ):
                loyalty_tier_ids = list(
                    self.instance.loyalty_tiers.values_list("id", flat=True)
                )
            if (
                audience_type == VoucherAudienceType.CUSTOMER_SEGMENT
                and customer_segment_ids is None
            ):
                customer_segment_ids = list(
                    self.instance.targets.filter(
                        target_type=PromotionTargetType.SEGMENT,
                    ).values_list("segment_id", flat=True)
                )

        dealer = self._resolve_dealer(attrs)

        tier_ids, segment_ids = validate_audience_payload(
            audience_type=audience_type,
            loyalty_tier_ids=loyalty_tier_ids,
            customer_segment_ids=customer_segment_ids,
            dealer=dealer,
            reject_customer_target=audience_inputs.get("reject_customer_target", False),
        )
        return audience_type, tier_ids, segment_ids

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

        audience_inputs = self._parse_audience_inputs(attrs)
        is_create = self.instance is None
        if is_create or self._audience_fields_in_request():
            audience_type, tier_ids, segment_ids = self._validate_and_prepare_audience(
                attrs,
                audience_inputs,
                is_partial_update=not is_create,
            )
            attrs["_audience_type"] = audience_type
            attrs["_loyalty_tier_ids"] = tier_ids
            attrs["_customer_segment_ids"] = segment_ids
        else:
            attrs["_audience_type"] = None
            attrs["_loyalty_tier_ids"] = None
            attrs["_customer_segment_ids"] = None
        attrs["_product_targets"] = audience_inputs.get("product_targets")
        return attrs

    def create(self, validated_data):
        audience_type = validated_data.pop("_audience_type", VoucherAudienceType.ALL)
        loyalty_tier_ids = validated_data.pop("_loyalty_tier_ids", [])
        customer_segment_ids = validated_data.pop("_customer_segment_ids", [])
        product_targets_data = validated_data.pop("_product_targets", None)
        request = self.context.get("request")

        if request and request.user:
            if hasattr(request.user, "dealer_profile"):
                validated_data["dealer"] = request.user.dealer_profile
            validated_data["created_by"] = request.user

        validated_data["audience_type"] = audience_type

        try:
            promotion = Promotion.objects.create(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError({
                "code": ["Mã voucher này đã tồn tại, vui lòng chọn mã khác."]
            })

        sync_promotion_audience(
            promotion,
            audience_type=audience_type,
            loyalty_tier_ids=loyalty_tier_ids,
            customer_segment_ids=customer_segment_ids,
        )
        if product_targets_data is not None:
            sync_promotion_product_targets(promotion, product_targets_data)
        return promotion

    def update(self, instance, validated_data):
        audience_type = validated_data.pop("_audience_type", None)
        loyalty_tier_ids = validated_data.pop("_loyalty_tier_ids", None)
        customer_segment_ids = validated_data.pop("_customer_segment_ids", None)
        product_targets_data = validated_data.pop("_product_targets", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if audience_type is not None:
            instance.audience_type = audience_type

        try:
            instance.save()
        except IntegrityError:
            raise serializers.ValidationError({
                "code": ["Mã voucher này đã tồn tại, vui lòng chọn mã khác."]
            })

        if audience_type is not None:
            sync_promotion_audience(
                instance,
                audience_type=audience_type,
                loyalty_tier_ids=loyalty_tier_ids or [],
                customer_segment_ids=customer_segment_ids or [],
            )

        if product_targets_data is not None:
            sync_promotion_product_targets(instance, product_targets_data)

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
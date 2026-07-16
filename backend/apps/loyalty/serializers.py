"""Serializer hạng thành viên và điểm tích lũy."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import (
    CustomerTierHistory,
    DealerLoyaltySettings,
    LoyaltyPointTransaction,
    LoyaltyTier,
)
from .services import build_loyalty_status


class LoyaltyTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTier
        fields = [
            "id",
            "code",
            "name",
            "level",
            "min_points",
            "description",
            "benefits",
            "is_active",
            "is_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_system", "created_at", "updated_at"]


class LoyaltyTierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTier
        fields = [
            "code",
            "name",
            "level",
            "min_points",
            "description",
            "benefits",
            "is_active",
        ]

    def validate_min_points(self, value):
        if value < 0:
            raise serializers.ValidationError("Ngưỡng điểm không được âm.")
        return value

    def validate_benefits(self, value):
        if value is None:
            return []
        if isinstance(value, str):
            stripped = value.strip()
            return [] if not stripped else [stripped]
        if isinstance(value, list):
            return [str(item) for item in value]
        raise serializers.ValidationError("benefits phải là danh sách quyền lợi.")

    def _resolve_dealer(self):
        dealer = self.context.get("dealer")
        if dealer is not None:
            return dealer
        if self.instance is not None:
            return self.instance.dealer
        return None

    def validate(self, attrs):
        dealer = self._resolve_dealer()
        if dealer is None:
            return attrs

        code = attrs.get("code", getattr(self.instance, "code", None))
        level = attrs.get("level", getattr(self.instance, "level", None))
        qs = LoyaltyTier.objects.filter(dealer=dealer)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        if code and qs.filter(code=code).exists():
            raise serializers.ValidationError({"code": "Mã hạng đã tồn tại tại cửa hàng này."})
        if level is not None and qs.filter(level=level).exists():
            raise serializers.ValidationError({"level": "Cấp độ hạng đã tồn tại tại cửa hàng này."})
        return attrs


class LoyaltyTierSummarySerializer(serializers.ModelSerializer):
    """Hạng rút gọn cho customer profile."""

    class Meta:
        model = LoyaltyTier
        fields = ["id", "code", "name", "level", "min_points", "benefits"]


class LoyaltyNextTierSerializer(serializers.ModelSerializer):
    remaining_points = serializers.SerializerMethodField()

    class Meta:
        model = LoyaltyTier
        fields = ["id", "code", "name", "level", "min_points", "remaining_points"]

    def get_remaining_points(self, obj):
        points = self.context.get("loyalty_points", 0)
        return max(obj.min_points - points, 0)


class LoyaltyStatusSerializer(serializers.Serializer):
    loyalty_points = serializers.IntegerField()
    current_tier = LoyaltyTierSummarySerializer(allow_null=True)
    next_tier = LoyaltyNextTierSerializer(allow_null=True)
    remaining_points = serializers.IntegerField(allow_null=True)
    message = serializers.CharField(allow_blank=True)


class DealerLoyaltySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealerLoyaltySettings
        fields = [
            "id",
            "points_per_unit",
            "include_shipping_in_points",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_points_per_unit(self, value):
        if value <= 0:
            raise serializers.ValidationError("Tỷ lệ quy đổi phải lớn hơn 0.")
        return value


class LoyaltyPointTransactionSerializer(serializers.ModelSerializer):
    transaction_type_label = serializers.CharField(
        source="get_transaction_type_display",
        read_only=True,
    )
    order_code = serializers.CharField(source="order.order_code", read_only=True, default="")

    class Meta:
        model = LoyaltyPointTransaction
        fields = [
            "id",
            "transaction_type",
            "transaction_type_label",
            "points",
            "balance_before",
            "balance_after",
            "reason",
            "order_id",
            "order_code",
            "created_at",
        ]


class CustomerTierHistorySerializer(serializers.ModelSerializer):
    old_tier = LoyaltyTierSummarySerializer(read_only=True)
    new_tier = LoyaltyTierSummarySerializer(read_only=True)

    class Meta:
        model = CustomerTierHistory
        fields = ["id", "old_tier", "new_tier", "reason", "changed_at"]


class LoyaltyTierStatsSerializer(serializers.Serializer):
    tier = LoyaltyTierSerializer()
    customer_count = serializers.IntegerField()


class ManualLoyaltyAdjustSerializer(serializers.Serializer):
    points = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(max_length=500)
    action = serializers.ChoiceField(choices=["add", "deduct"])


def serialize_loyalty_status(customer):
    status = build_loyalty_status(customer)
    current_tier = status["current_tier"]
    next_tier = status["next_tier"]
    return {
        "loyalty_points": status["loyalty_points"],
        "current_tier": (
            LoyaltyTierSummarySerializer(current_tier).data if current_tier else None
        ),
        "next_tier": (
            LoyaltyNextTierSerializer(
                next_tier,
                context={"loyalty_points": status["loyalty_points"]},
            ).data
            if next_tier
            else None
        ),
        "remaining_points": status["remaining_points"],
        "message": status["message"],
    }

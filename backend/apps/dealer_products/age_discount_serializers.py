"""Serializer chính sách giảm giá theo tuổi hàng."""

from rest_framework import serializers

from common.openapi_enums import schema_choice_field

from .models_age_discount import (
    AgeDiscountDiscountType,
    AgeDiscountPolicy,
    AgeDiscountScope,
    AgeDiscountThresholdType,
    AgeDiscountTier,
    AgeDiscountTierOperator,
)


class AgeDiscountTierSerializer(serializers.ModelSerializer):
    operator = schema_choice_field(choices=AgeDiscountTierOperator.choices)
    discount_type = schema_choice_field(choices=AgeDiscountDiscountType.choices)

    class Meta:
        model = AgeDiscountTier
        fields = [
            "id",
            "operator",
            "threshold_value",
            "discount_type",
            "discount_value",
            "sort_order",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AgeDiscountTierWriteSerializer(serializers.Serializer):
    operator = schema_choice_field(choices=AgeDiscountTierOperator.choices)
    threshold_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount_type = schema_choice_field(choices=AgeDiscountDiscountType.choices)
    discount_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    sort_order = serializers.IntegerField(min_value=0, default=0)


class AgeDiscountPolicyListSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=AgeDiscountScope.choices, read_only=True)
    threshold_type = schema_choice_field(
        choices=AgeDiscountThresholdType.choices,
        read_only=True,
    )
    tier_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AgeDiscountPolicy
        fields = [
            "id",
            "title",
            "scope",
            "category",
            "dealer_product",
            "threshold_type",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "tier_count",
            "created_at",
            "updated_at",
        ]


class AgeDiscountPolicyDetailSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=AgeDiscountScope.choices)
    threshold_type = schema_choice_field(choices=AgeDiscountThresholdType.choices)
    tiers = AgeDiscountTierSerializer(many=True, read_only=True)

    class Meta:
        model = AgeDiscountPolicy
        fields = [
            "id",
            "title",
            "scope",
            "category",
            "dealer_product",
            "threshold_type",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "tiers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AgeDiscountPolicyWriteSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=AgeDiscountScope.choices)
    threshold_type = schema_choice_field(choices=AgeDiscountThresholdType.choices)
    tiers = AgeDiscountTierWriteSerializer(many=True, required=False, default=list)

    class Meta:
        model = AgeDiscountPolicy
        fields = [
            "title",
            "scope",
            "category",
            "dealer_product",
            "threshold_type",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "tiers",
        ]

    def _get_dealer(self):
        user = self.context["request"].user
        if user.role == "admin":
            return None
        return user.dealer_profile

    def validate(self, attrs):
        scope = attrs.get("scope", getattr(self.instance, "scope", None))
        category = attrs.get("category", getattr(self.instance, "category", None))
        dealer_product = attrs.get(
            "dealer_product",
            getattr(self.instance, "dealer_product", None),
        )
        dealer = self._get_dealer()

        if scope == AgeDiscountScope.ALL:
            if category or dealer_product:
                raise serializers.ValidationError(
                    {"scope": "scope=all không được gán category hoặc dealer_product."}
                )
        elif scope == AgeDiscountScope.CATEGORY:
            if not category:
                raise serializers.ValidationError(
                    {"category": "Bắt buộc khi scope=category."}
                )
            if dealer_product:
                raise serializers.ValidationError(
                    {"dealer_product": "Không dùng khi scope=category."}
                )
            if dealer:
                from apps.categories.models import CategoryScope

                if (
                    category.scope == CategoryScope.CUSTOM
                    and category.created_by_id != dealer.account_id
                ):
                    raise serializers.ValidationError(
                        {"category": "Danh mục không thuộc đại lý."}
                    )
        elif scope == AgeDiscountScope.DEALER_PRODUCT:
            if not dealer_product:
                raise serializers.ValidationError(
                    {"dealer_product": "Bắt buộc khi scope=dealer_product."}
                )
            if category:
                raise serializers.ValidationError(
                    {"category": "Không dùng khi scope=dealer_product."}
                )
            if dealer and dealer_product.dealer_profile_id != dealer.id:
                raise serializers.ValidationError(
                    {"dealer_product": "Sản phẩm không thuộc đại lý."}
                )

        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end_at = attrs.get("end_at", getattr(self.instance, "end_at", None))
        if start_at and end_at and start_at > end_at:
            raise serializers.ValidationError(
                {"end_at": "end_at phải sau start_at."}
            )

        tiers = attrs.get("tiers")
        if tiers is not None:
            for tier in tiers:
                if tier["discount_value"] <= 0:
                    raise serializers.ValidationError(
                        {"tiers": "discount_value phải lớn hơn 0."}
                    )
                if (
                    tier["discount_type"] == AgeDiscountDiscountType.PERCENT
                    and tier["discount_value"] > 100
                ):
                    raise serializers.ValidationError(
                        {"tiers": "Giảm % không vượt quá 100."}
                    )
        return attrs

    def _save_tiers(self, policy, tiers_data):
        policy.tiers.all().delete()
        for row in tiers_data:
            AgeDiscountTier.objects.create(policy=policy, **row)

    def create(self, validated_data):
        tiers_data = validated_data.pop("tiers", [])
        dealer = self._get_dealer()
        if dealer is None:
            raise serializers.ValidationError({"detail": "Admin cần chỉ định dealer."})
        policy = AgeDiscountPolicy.objects.create(dealer=dealer, **validated_data)
        if tiers_data:
            self._save_tiers(policy, tiers_data)
        return policy

    def update(self, instance, validated_data):
        tiers_data = validated_data.pop("tiers", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tiers_data is not None:
            self._save_tiers(instance, tiers_data)
        return instance


class AgeDiscountTiersReplaceSerializer(serializers.Serializer):
    tiers = AgeDiscountTierWriteSerializer(many=True)

    def validate_tiers(self, value):
        if not value:
            raise serializers.ValidationError("Cần ít nhất một bậc giảm.")
        return value


class SetBatchSalePriceSerializer(serializers.Serializer):
    manual_sale_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        help_text="Giá bán thủ công cho lô — ưu tiên hơn policy tự động",
    )

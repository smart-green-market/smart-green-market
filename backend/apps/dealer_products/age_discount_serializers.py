"""Serializer chính sách giảm giá theo tuổi hàng."""

from rest_framework import serializers

from common.openapi_enums import schema_choice_field

from .models_age_discount import (
    AgeDiscountDiscountType,
    AgeDiscountPolicy,
    AgeDiscountScope,
)


class AgeDiscountPolicyListSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=AgeDiscountScope.choices, read_only=True)
    discount_type = schema_choice_field(
        choices=AgeDiscountDiscountType.choices,
        read_only=True,
    )

    class Meta:
        model = AgeDiscountPolicy
        fields = [
            "id",
            "title",
            "scope",
            "category",
            "dealer_product",
            "discount_type",
            "discount_value",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "created_at",
            "updated_at",
        ]


class AgeDiscountPolicyDetailSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=AgeDiscountScope.choices)
    discount_type = schema_choice_field(choices=AgeDiscountDiscountType.choices)

    class Meta:
        model = AgeDiscountPolicy
        fields = [
            "id",
            "title",
            "scope",
            "category",
            "dealer_product",
            "discount_type",
            "discount_value",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AgeDiscountPolicyWriteSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=AgeDiscountScope.choices)
    discount_type = schema_choice_field(choices=AgeDiscountDiscountType.choices)
    discount_value = serializers.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        model = AgeDiscountPolicy
        fields = [
            "title",
            "scope",
            "category",
            "dealer_product",
            "discount_type",
            "discount_value",
            "priority",
            "is_active",
            "start_at",
            "end_at",
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

        discount_type = attrs.get(
            "discount_type",
            getattr(self.instance, "discount_type", None),
        )
        discount_value = attrs.get(
            "discount_value",
            getattr(self.instance, "discount_value", None),
        )
        if discount_value is not None:
            if discount_value <= 0:
                raise serializers.ValidationError(
                    {"discount_value": "discount_value phải lớn hơn 0."}
                )
            if (
                discount_type == AgeDiscountDiscountType.PERCENT
                and discount_value > 100
            ):
                raise serializers.ValidationError(
                    {"discount_value": "Giảm % không vượt quá 100."}
                )
        return attrs

    def create(self, validated_data):
        dealer = self._get_dealer()
        if dealer is None:
            raise serializers.ValidationError({"detail": "Admin cần chỉ định dealer."})
        policy = AgeDiscountPolicy.objects.create(dealer=dealer, **validated_data)
        return policy

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SetBatchSalePriceSerializer(serializers.Serializer):
    manual_sale_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        help_text="Giá bán thủ công cho lô — ưu tiên hơn policy tự động",
    )

"""Serializer chính sách giảm giá theo số lượng."""

from decimal import Decimal

from rest_framework import serializers

from apps.categories.models import CategoryScope
from common.openapi_enums import schema_choice_field

from .models_quantity_discount import (
    QuantityDiscountPolicy,
    QuantityDiscountScope,
    QuantityDiscountTier,
    QuantityDiscountType,
)


class QuantityDiscountTierSerializer(serializers.ModelSerializer):
    discount_type = schema_choice_field(
        choices=QuantityDiscountType.choices,
        read_only=True,
    )

    class Meta:
        model = QuantityDiscountTier
        fields = [
            "id",
            "min_quantity",
            "discount_type",
            "discount_value",
            "sort_order",
        ]


class QuantityDiscountTierWriteSerializer(serializers.Serializer):
    min_quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount_type = schema_choice_field(choices=QuantityDiscountType.choices)
    discount_value = serializers.DecimalField(max_digits=12, decimal_places=2)


class QuantityDiscountPolicyListSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=QuantityDiscountScope.choices, read_only=True)
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
        allow_null=True,
    )
    supplier_product_name = serializers.CharField(
        source="supplier_product.name",
        read_only=True,
        allow_null=True,
    )
    tier_count = serializers.SerializerMethodField()
    min_tier_quantity = serializers.SerializerMethodField()
    max_discount_label = serializers.SerializerMethodField()

    class Meta:
        model = QuantityDiscountPolicy
        fields = [
            "id",
            "title",
            "scope",
            "category",
            "category_name",
            "supplier_product",
            "supplier_product_name",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "tier_count",
            "min_tier_quantity",
            "max_discount_label",
            "created_at",
            "updated_at",
        ]

    def get_tier_count(self, obj):
        return obj.tiers.count()

    def get_min_tier_quantity(self, obj):
        tier = obj.tiers.order_by("min_quantity").first()
        return tier.min_quantity if tier else None

    def get_max_discount_label(self, obj):
        tier = obj.tiers.order_by("-discount_value").first()
        if not tier:
            return None
        if tier.discount_type == QuantityDiscountType.PERCENT:
            return f"{tier.discount_value}%"
        return f"{tier.discount_value}đ"


class QuantityDiscountPolicyDetailSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=QuantityDiscountScope.choices)
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
        allow_null=True,
    )
    supplier_product_name = serializers.CharField(
        source="supplier_product.name",
        read_only=True,
        allow_null=True,
    )
    tiers = QuantityDiscountTierSerializer(many=True, read_only=True)

    class Meta:
        model = QuantityDiscountPolicy
        fields = [
            "id",
            "title",
            "scope",
            "category",
            "category_name",
            "supplier_product",
            "supplier_product_name",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "tiers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class QuantityDiscountPolicyWriteSerializer(serializers.ModelSerializer):
    scope = schema_choice_field(choices=QuantityDiscountScope.choices)
    tiers = QuantityDiscountTierWriteSerializer(many=True, required=False)

    class Meta:
        model = QuantityDiscountPolicy
        fields = [
            "title",
            "scope",
            "category",
            "supplier_product",
            "priority",
            "is_active",
            "start_at",
            "end_at",
            "tiers",
        ]

    def _get_supplier(self):
        user = self.context["request"].user
        if user.role == "admin":
            return None
        return user.supplier_profile

    def _validate_tiers(self, tiers_data):
        if not tiers_data:
            raise serializers.ValidationError(
                {"tiers": "Cần ít nhất một bậc giảm giá."}
            )

        min_quantities = []
        for index, tier in enumerate(tiers_data):
            min_qty = tier.get("min_quantity")
            discount_type = tier.get("discount_type")
            discount_value = tier.get("discount_value")

            if min_qty is None or min_qty <= 0:
                raise serializers.ValidationError(
                    {f"tiers[{index}].min_quantity": "Số lượng tối thiểu phải lớn hơn 0."}
                )
            if discount_value is None or discount_value <= 0:
                raise serializers.ValidationError(
                    {f"tiers[{index}].discount_value": "Mức giảm phải lớn hơn 0."}
                )
            if (
                discount_type == QuantityDiscountType.PERCENT
                and discount_value > 100
            ):
                raise serializers.ValidationError(
                    {f"tiers[{index}].discount_value": "Giảm % không vượt quá 100."}
                )
            min_quantities.append(min_qty)

        if len(min_quantities) != len(set(min_quantities)):
            raise serializers.ValidationError(
                {"tiers": "Các bậc không được trùng số lượng tối thiểu."}
            )

    def validate(self, attrs):
        scope = attrs.get("scope", getattr(self.instance, "scope", None))
        category = attrs.get("category", getattr(self.instance, "category", None))
        supplier_product = attrs.get(
            "supplier_product",
            getattr(self.instance, "supplier_product", None),
        )
        supplier = self._get_supplier()
        tiers_data = attrs.get("tiers")

        if scope == QuantityDiscountScope.ALL:
            if category or supplier_product:
                raise serializers.ValidationError(
                    {"scope": "scope=all không được gán category hoặc supplier_product."}
                )
        elif scope == QuantityDiscountScope.CATEGORY:
            if not category:
                raise serializers.ValidationError(
                    {"category": "Bắt buộc khi scope=category."}
                )
            if supplier_product:
                raise serializers.ValidationError(
                    {"supplier_product": "Không dùng khi scope=category."}
                )
            if supplier:
                if (
                    category.scope == CategoryScope.CUSTOM
                    and category.created_by_id != supplier.account_id
                ):
                    raise serializers.ValidationError(
                        {"category": "Danh mục không thuộc nhà cung cấp."}
                    )
        elif scope == QuantityDiscountScope.SUPPLIER_PRODUCT:
            if not supplier_product:
                raise serializers.ValidationError(
                    {"supplier_product": "Bắt buộc khi scope=supplier_product."}
                )
            if category:
                raise serializers.ValidationError(
                    {"category": "Không dùng khi scope=supplier_product."}
                )
            if supplier and supplier_product.supplier_id != supplier.id:
                raise serializers.ValidationError(
                    {"supplier_product": "Sản phẩm không thuộc nhà cung cấp."}
                )

        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end_at = attrs.get("end_at", getattr(self.instance, "end_at", None))
        if start_at and end_at and start_at > end_at:
            raise serializers.ValidationError({"end_at": "end_at phải sau start_at."})

        if tiers_data is not None:
            self._validate_tiers(tiers_data)
        elif self.instance is None:
            raise serializers.ValidationError({"tiers": "Cần ít nhất một bậc giảm giá."})

        return attrs

    def _apply_scope_foreign_keys(self, validated_data, scope):
        if scope == QuantityDiscountScope.ALL:
            validated_data["category"] = None
            validated_data["supplier_product"] = None
        elif scope == QuantityDiscountScope.CATEGORY:
            validated_data["supplier_product"] = None
        elif scope == QuantityDiscountScope.SUPPLIER_PRODUCT:
            validated_data["category"] = None
        return validated_data

    def _save_tiers(self, policy, tiers_data):
        policy.tiers.all().delete()
        sorted_tiers = sorted(
            tiers_data,
            key=lambda row: Decimal(row["min_quantity"]),
        )
        for index, tier in enumerate(sorted_tiers):
            QuantityDiscountTier.objects.create(
                policy=policy,
                min_quantity=tier["min_quantity"],
                discount_type=tier["discount_type"],
                discount_value=tier["discount_value"],
                sort_order=index,
            )

    def create(self, validated_data):
        supplier = self._get_supplier()
        if supplier is None:
            raise serializers.ValidationError({"detail": "Admin cần chỉ định supplier."})
        tiers_data = validated_data.pop("tiers")
        scope = validated_data.get("scope")
        validated_data = self._apply_scope_foreign_keys(validated_data, scope)
        policy = QuantityDiscountPolicy.objects.create(supplier=supplier, **validated_data)
        self._save_tiers(policy, tiers_data)
        return policy

    def update(self, instance, validated_data):
        tiers_data = validated_data.pop("tiers", None)
        scope = validated_data.get("scope", instance.scope)
        validated_data = self._apply_scope_foreign_keys(validated_data, scope)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tiers_data is not None:
            self._save_tiers(instance, tiers_data)
        return instance

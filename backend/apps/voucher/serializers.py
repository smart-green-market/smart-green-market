# promotions/serializers.py
from rest_framework import serializers
from apps.promotions.models import Promotion, PromotionTarget


class AvailablePromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = [
            "id", "title", "description",
            "discount_type", "discount_value",
            "start_date", "end_date",
        ]


class PromotionTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionTarget
        fields = [
            "id",
            "target_type",
            "segment",
            "dealer_product",
            "category",
        ]


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
            "targets",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "dealer", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("start_date phải trước end_date")
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

"""Serializer Product Master và Season."""

from rest_framework import serializers

from common.approval_nested import ApprovalCategoryNestedSerializer
from common.openapi_enums import schema_choice_field

from .models import ProductMaster, ProductMasterStatus, Season, SeasonStatus
from .services import ensure_system_category, generate_unique_master_slug, validate_month


class SeasonListSerializer(serializers.ModelSerializer):
    status = schema_choice_field(choices=SeasonStatus.choices, read_only=True)

    class Meta:
        model = Season
        fields = [
            "id",
            "code",
            "name",
            "description",
            "start_month",
            "end_month",
            "sort_order",
            "status",
        ]


class SeasonWriteSerializer(serializers.ModelSerializer):
    status = schema_choice_field(
        choices=SeasonStatus.choices,
        required=False,
        default=SeasonStatus.ACTIVE,
    )

    class Meta:
        model = Season
        fields = [
            "code",
            "name",
            "description",
            "start_month",
            "end_month",
            "sort_order",
            "status",
        ]

    def validate_start_month(self, value):
        return validate_month(value, field="start_month")

    def validate_end_month(self, value):
        return validate_month(value, field="end_month")

    def validate_code(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Mã mùa không được để trống.")
        return value


class ProductMasterListSerializer(serializers.ModelSerializer):
    category = ApprovalCategoryNestedSerializer(read_only=True)
    status = schema_choice_field(choices=ProductMasterStatus.choices, read_only=True)
    seasons = SeasonListSerializer(many=True, read_only=True)

    class Meta:
        model = ProductMaster
        fields = [
            "id",
            "category",
            "name",
            "slug",
            "default_unit",
            "description",
            "seasons",
            "status",
            "sort_order",
        ]


class ProductMasterWriteSerializer(serializers.ModelSerializer):
    status = schema_choice_field(
        choices=ProductMasterStatus.choices,
        required=False,
        default=ProductMasterStatus.ACTIVE,
    )
    season_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Season.objects.filter(status=SeasonStatus.ACTIVE),
        required=False,
        allow_empty=True,
        write_only=True,
    )

    class Meta:
        model = ProductMaster
        fields = [
            "category",
            "name",
            "default_unit",
            "description",
            "season_ids",
            "status",
            "sort_order",
        ]

    def validate_category(self, category):
        ensure_system_category(category)
        return category

    def create(self, validated_data):
        season_ids = validated_data.pop("season_ids", [])
        validated_data["slug"] = generate_unique_master_slug(
            validated_data["category"],
            validated_data["name"],
        )
        instance = super().create(validated_data)
        if season_ids:
            instance.seasons.set(season_ids)
        return instance

    def update(self, instance, validated_data):
        season_ids = validated_data.pop("season_ids", None)
        category = validated_data.get("category", instance.category)
        name = validated_data.get("name", instance.name)
        if category != instance.category or name != instance.name:
            validated_data["slug"] = generate_unique_master_slug(
                category,
                name,
                exclude_pk=instance.pk,
            )
        instance = super().update(instance, validated_data)
        if season_ids is not None:
            instance.seasons.set(season_ids)
        return instance

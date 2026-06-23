"""Serializer Product Master."""

from rest_framework import serializers

from common.approval_nested import ApprovalCategoryNestedSerializer
from common.openapi_enums import schema_choice_field

from .models import ProductMaster, ProductMasterStatus
from .services import ensure_system_category, generate_unique_master_slug


class ProductMasterListSerializer(serializers.ModelSerializer):
    category = ApprovalCategoryNestedSerializer(read_only=True)
    status = schema_choice_field(choices=ProductMasterStatus.choices, read_only=True)

    class Meta:
        model = ProductMaster
        fields = [
            "id",
            "category",
            "name",
            "slug",
            "default_unit",
            "description",
            "status",
            "sort_order",
        ]


class ProductMasterWriteSerializer(serializers.ModelSerializer):
    status = schema_choice_field(
        choices=ProductMasterStatus.choices,
        required=False,
        default=ProductMasterStatus.ACTIVE,
    )

    class Meta:
        model = ProductMaster
        fields = [
            "category",
            "name",
            "default_unit",
            "description",
            "status",
            "sort_order",
        ]
        extra_kwargs = {
            "category": {"help_text": "ID danh mục hệ thống (scope=system, active)"},
            "name": {"help_text": "Tên sản phẩm chuẩn (vd. Cà chua)"},
            "default_unit": {"help_text": "Đơn vị mặc định (kg, bó...)"},
            "description": {"help_text": "Mô tả chuẩn (optional)"},
            "sort_order": {"help_text": "Thứ tự hiển thị trong dropdown"},
        }

    def validate_category(self, category):
        ensure_system_category(category)
        return category

    def create(self, validated_data):
        validated_data["slug"] = generate_unique_master_slug(
            validated_data["category"],
            validated_data["name"],
        )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category = validated_data.get("category", instance.category)
        name = validated_data.get("name", instance.name)
        if category != instance.category or name != instance.name:
            validated_data["slug"] = generate_unique_master_slug(
                category,
                name,
                exclude_pk=instance.pk,
            )
        return super().update(instance, validated_data)

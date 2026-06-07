from rest_framework import serializers

from apps.categories.models import Category, CategoryStatus
from common.approval_nested import ApprovalAccountNestedSerializer
from common.openapi_enums import schema_choice_field
from common.business_rules import MAX_CATEGORIES_PER_SUPPLIER


class CategoryReadSerializer(serializers.ModelSerializer):
    status = schema_choice_field(choices=CategoryStatus.choices, read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "status",
            "sort_order",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]


class CategoryListSerializer(CategoryReadSerializer):
    """Danh mục kèm người tạo — dùng cho danh sách chờ duyệt."""

    created_by = ApprovalAccountNestedSerializer(read_only=True)

    class Meta(CategoryReadSerializer.Meta):
        fields = CategoryReadSerializer.Meta.fields + ["created_by"]


class CategorySerializer(serializers.ModelSerializer):
    status = schema_choice_field(choices=CategoryStatus.choices, read_only=True)

    class Meta:
        model = Category
        fields = "__all__"
        read_only_fields = [
            "status",
            "created_by",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "name": {"help_text": "Tên danh mục (vd: Rau củ, Trái cây)"},
            "description": {
                "help_text": "Mô tả ngắn về danh mục",
                "required": False,
            },
            "sort_order": {
                "help_text": "Thứ tự hiển thị (Admin quản lý qua /reorder/)",
                "required": False,
            },
        }

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            self.instance is None
            and request
            and request.user.is_authenticated
            and request.user.role in ("supplier", "dealer")
        ):
            count = Category.objects.filter(created_by=request.user).count()
            if count >= MAX_CATEGORIES_PER_SUPPLIER:
                raise serializers.ValidationError(
                    f"Mỗi nhà cung cấp tối đa {MAX_CATEGORIES_PER_SUPPLIER} danh mục."
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        validated_data.setdefault("status", CategoryStatus.PENDING)
        return super().create(validated_data)


class VerifyCategorySerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=[
            CategoryStatus.ACTIVE,
            CategoryStatus.REJECTED,
            CategoryStatus.INACTIVE,
        ],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Lý do từ chối/khóa",
    )


class CategoryReorderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    sort_order = serializers.IntegerField(min_value=0)


class CategoryReorderSerializer(serializers.Serializer):
    items = CategoryReorderItemSerializer(many=True)

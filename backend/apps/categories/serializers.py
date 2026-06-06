from rest_framework import serializers

from apps.categories.models import Category, CategoryStatus
from common.business_rules import MAX_CATEGORIES_PER_SUPPLIER


class CategorySerializer(serializers.ModelSerializer):
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
            and request.user.role == "supplier"
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
    status = serializers.ChoiceField(
        choices=[
            CategoryStatus.ACTIVE,
            CategoryStatus.REJECTED,
            CategoryStatus.INACTIVE,
        ],
        help_text="active (duyệt) | rejected (từ chối) | inactive (khóa)",
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

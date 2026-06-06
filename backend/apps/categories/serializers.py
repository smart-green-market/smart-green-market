from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        extra_kwargs = {
            "name": {
                "help_text": "Tên danh mục (vd: Rau củ, Trái cây)",
            },
            "description": {
                "help_text": "Mô tả ngắn về danh mục",
                "required": False,
            },
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }
    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)

"""Serializer catalog sản phẩm buyer trên gian hàng đại lý."""

from rest_framework import serializers

from apps.categories.models import Category
from apps.categories.serializers import DealerStoreCategorySerializer
from apps.dealer_products.models import DealerProduct
from apps.dealer_products.serializers import DealerProductImageSerializer


class StorefrontCategorySerializer(DealerStoreCategorySerializer):
    """Danh mục cửa hàng — buyer xem trước khi chọn sản phẩm."""


class StorefrontProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "sort_order"]


class StorefrontProductListSerializer(serializers.ModelSerializer):
    """Sản phẩm trên danh sách / tìm kiếm."""

    images = DealerProductImageSerializer(many=True, read_only=True)
    category = StorefrontProductCategorySerializer(read_only=True)
    unit = serializers.CharField(source="supplier_product.unit", read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = DealerProduct
        fields = [
            "id",
            "title",
            "description",
            "retail_price",
            "thumbnail",
            "category",
            "unit",
            "available_quantity",
            "in_stock",
            "created_at",
            "updated_at",
            "images",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["in_stock"] = getattr(instance, "available_quantity", 0) > 0
        return data


class StorefrontProductDetailSerializer(StorefrontProductListSerializer):
    """Chi tiết sản phẩm — thêm thông tin bảo quản từ NCC gốc."""

    supplier_product_name = serializers.CharField(
        source="supplier_product.name",
        read_only=True,
    )
    supplier_name = serializers.CharField(
        source="supplier_product.supplier.company_name",
        read_only=True,
    )
    storage_duration_days = serializers.IntegerField(
        source="supplier_product.storage_duration_days",
        read_only=True,
        allow_null=True,
    )
    min_storage_temp = serializers.DecimalField(
        source="supplier_product.min_storage_temp",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    max_storage_temp = serializers.DecimalField(
        source="supplier_product.max_storage_temp",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )

    class Meta(StorefrontProductListSerializer.Meta):
        fields = StorefrontProductListSerializer.Meta.fields + [
            "supplier_product_name",
            "supplier_name",
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
        ]

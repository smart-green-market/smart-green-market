"""Serializer cho danh mục sản phẩm nông sản."""

from rest_framework import serializers

from apps.accounts.models import AccountRole
from apps.categories.models import Category, CategoryStatus
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.dealer_products.serializers import DealerProductReadSerializer
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.supplier_products.serializer import (
    SupplierProductListSerializer,
    SupplierProductReadSerializer,
)
from common.approval_nested import ApprovalAccountNestedSerializer
from common.openapi_enums import schema_choice_field
from common.business_rules import MAX_CATEGORIES_PER_SUPPLIER
from common.validators import require_rejection_reason


class CategoryReadSerializer(serializers.ModelSerializer):
    """Serializer đọc thông tin danh mục (không kèm người tạo)."""

    status = schema_choice_field(choices=CategoryStatus.choices, read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        """Cấu hình trường serializer đọc danh mục."""

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
        extra_kwargs = {
            "id": {"help_text": "ID danh mục"},
            "name": {"help_text": "Tên danh mục"},
            "description": {"help_text": "Mô tả ngắn"},
            "sort_order": {"help_text": "Thứ tự hiển thị (số nhỏ hiện trước)"},
            "verified_by": {"help_text": "ID admin duyệt"},
            "verified_at": {"help_text": "Thời điểm duyệt/từ chối"},
            "rejection_reason": {"help_text": "Lý do từ chối (nếu status=rejected)"},
            "created_at": {"help_text": "Thời điểm tạo"},
            "updated_at": {"help_text": "Thời điểm cập nhật gần nhất"},
        }


class CategoryListSerializer(CategoryReadSerializer):
    """Danh mục kèm người tạo — dùng cho danh sách chờ duyệt."""

    created_by = ApprovalAccountNestedSerializer(read_only=True)
    product_count = serializers.IntegerField(
        read_only=True,
        help_text="Số sản phẩm thuộc danh mục của tài khoản hiện tại (đại lý/NCC)",
    )

    class Meta(CategoryReadSerializer.Meta):
        """Mở rộng trường thêm thông tin người tạo."""

        fields = CategoryReadSerializer.Meta.fields + ["created_by", "product_count"]


class CategoryDetailSerializer(CategoryListSerializer):
    """Chi tiết danh mục kèm danh sách sản phẩm thuộc danh mục."""

    products = serializers.SerializerMethodField(
        help_text="Sản phẩm thuộc danh mục của tài khoản hiện tại",
    )

    class Meta(CategoryListSerializer.Meta):
        fields = CategoryListSerializer.Meta.fields + ["products"]

    def get_products(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return []

        user = request.user
        if user.role == AccountRole.DEALER:
            products = (
                DealerProduct.objects.filter(
                    supplier_product__category=obj,
                    dealer_profile__account=user,
                )
                .exclude(status=DealerProductStatus.DELETED)
                .select_related("supplier_product")
                .prefetch_related("images")
                .order_by("-updated_at", "-id")
            )
            return DealerProductReadSerializer(
                products, many=True, context=self.context
            ).data

        if user.role == AccountRole.SUPPLIER:
            profile = getattr(user, "supplier_profile", None)
            if not profile:
                return []
            products = (
                SupplierProduct.objects.filter(category=obj, supplier=profile)
                .exclude(status=SupplierProductStatus.DELETED)
                .prefetch_related("images")
                .order_by("-updated_at", "-id")
            )
            return SupplierProductReadSerializer(
                products, many=True, context=self.context
            ).data

        products = (
            SupplierProduct.objects.filter(category=obj)
            .exclude(status=SupplierProductStatus.DELETED)
            .select_related("supplier", "category")
            .prefetch_related("images")
            .order_by("-updated_at", "-id")
        )
        return SupplierProductListSerializer(
            products, many=True, context=self.context
        ).data


class CategorySerializer(serializers.ModelSerializer):
    """Serializer tạo và cập nhật danh mục."""

    status = schema_choice_field(choices=CategoryStatus.choices, read_only=True)

    class Meta:
        """Cấu hình trường ghi danh mục."""

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
        """Kiểm tra giới hạn số danh mục mỗi nhà cung cấp."""
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
        """Tạo danh mục mới với trạng thái chờ duyệt."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        validated_data.setdefault("status", CategoryStatus.PENDING)
        return super().create(validated_data)


class VerifyCategorySerializer(serializers.Serializer):
    """Serializer Admin duyệt, từ chối hoặc khóa danh mục."""

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
        help_text="Bắt buộc khi status=rejected hoặc inactive",
    )

    def validate(self, attrs):
        return require_rejection_reason(
            attrs,
            "status",
            "rejection_reason",
            {CategoryStatus.REJECTED, CategoryStatus.INACTIVE},
        )


class CategoryReorderItemSerializer(serializers.Serializer):
    """Một phần tử trong danh sách sắp xếp lại danh mục."""

    id = serializers.IntegerField(help_text="ID danh mục cần đổi thứ tự")
    sort_order = serializers.IntegerField(
        min_value=0,
        help_text="Thứ tự hiển thị mới (số nhỏ hiện trước)",
    )


class CategoryReorderSerializer(serializers.Serializer):
    """Serializer Admin sắp xếp thứ tự hiển thị nhiều danh mục."""

    items = CategoryReorderItemSerializer(
        many=True,
        help_text="Danh sách {id, sort_order} cần cập nhật",
    )

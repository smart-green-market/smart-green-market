"""Serializer catalog sản phẩm buyer trên gian hàng đại lý."""

from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.categories.models import Category
from apps.dealers.models import DealerProfile
from apps.accounts.models import AccountDocumentType
from common.avatar import build_avatar_url
from common.files import build_media_url
from apps.categories.serializers import DealerStoreCategorySerializer
from apps.dealer_products.models import DealerProduct
from apps.dealer_products.serializers import DealerProductImageSerializer
from apps.supplier_products.models import CultivationProcess


class StorefrontCategorySerializer(DealerStoreCategorySerializer):
    """Danh mục cửa hàng — buyer xem trước khi chọn sản phẩm."""


class StorefrontDealerContactSerializer(serializers.Serializer):
    """Thông tin liên hệ công khai của đại lý."""

    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    avatar_url = serializers.URLField(read_only=True, allow_null=True)


class StorefrontDealerStatsSerializer(serializers.Serializer):
    active_product_count = serializers.IntegerField(read_only=True)
    category_count = serializers.IntegerField(read_only=True)
    customer_count = serializers.IntegerField(read_only=True)
    completed_order_count = serializers.IntegerField(read_only=True)
    total_sold = serializers.IntegerField(read_only=True)


class StorefrontDealerReviewSummarySerializer(serializers.Serializer):
    review_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True, allow_null=True)
    rating_distribution = serializers.DictField(
        child=serializers.IntegerField(),
        read_only=True,
    )


class StorefrontDeliveryPolicySerializer(serializers.Serializer):
    timezone = serializers.CharField(read_only=True)
    min_lead_hours = serializers.IntegerField(read_only=True)
    morning_cutoff_hour = serializers.IntegerField(read_only=True)
    max_booking_days = serializers.IntegerField(read_only=True)
    shipping_fee = serializers.IntegerField(read_only=True)
    min_order_amount = serializers.IntegerField(read_only=True)
    slots = serializers.ListField(read_only=True)


class StorefrontDealerProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ gian hàng công khai — trang Giới thiệu / Liên hệ."""

    logo_url = serializers.SerializerMethodField(read_only=True)
    contact = serializers.SerializerMethodField(read_only=True)
    storefront_path = serializers.SerializerMethodField(read_only=True)
    storefront_url = serializers.SerializerMethodField(read_only=True)
    is_platform_verified = serializers.SerializerMethodField(read_only=True)
    verification_badges = serializers.SerializerMethodField(read_only=True)
    stats = serializers.SerializerMethodField(read_only=True)
    review_summary = serializers.SerializerMethodField(read_only=True)
    delivery_policy = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DealerProfile
        fields = [
            "id",
            "store_name",
            "slug",
            "store_address",
            "logo_url",
            "description",
            "created_at",
            "verified_at",
            "is_platform_verified",
            "verification_badges",
            "contact",
            "storefront_path",
            "storefront_url",
            "stats",
            "review_summary",
            "delivery_policy",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_logo_url(self, obj):
        return build_media_url(obj.logo, self.context.get("request"))

    @extend_schema_field(StorefrontDealerContactSerializer)
    def get_contact(self, obj):
        account = obj.account
        return StorefrontDealerContactSerializer(
            {
                "full_name": account.full_name,
                "phone": account.phone or "",
                "email": account.email,
                "avatar_url": build_avatar_url(account, self.context.get("request")),
            }
        ).data

    @extend_schema_field(serializers.CharField)
    def get_storefront_path(self, obj):
        return f"/cua-hang/{obj.slug}"

    @extend_schema_field(serializers.URLField)
    def get_storefront_url(self, obj):
        return f"{settings.STOREFRONT_BASE_URL}/cua-hang/{obj.slug}"

    @extend_schema_field(serializers.BooleanField)
    def get_is_platform_verified(self, obj):
        return obj.verified_at is not None

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_verification_badges(self, obj):
        labels = dict(AccountDocumentType.choices)
        badges = []
        for doc in obj.account.documents.all():
            label = labels.get(doc.document_type, doc.document_type)
            if label not in badges:
                badges.append(label)
        return badges

    @extend_schema_field(StorefrontDealerStatsSerializer)
    def get_stats(self, obj):
        return StorefrontDealerStatsSerializer(self.context.get("stats", {})).data

    @extend_schema_field(StorefrontDealerReviewSummarySerializer)
    def get_review_summary(self, obj):
        return StorefrontDealerReviewSummarySerializer(
            self.context.get("review_summary", {})
        ).data

    @extend_schema_field(StorefrontDeliveryPolicySerializer)
    def get_delivery_policy(self, obj):
        return StorefrontDeliveryPolicySerializer(
            self.context.get("delivery_policy", {})
        ).data


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


class StorefrontBestsellerProductSerializer(StorefrontProductListSerializer):
    """Sản phẩm bán chạy — thêm tổng số lượng đã bán."""

    total_sold = serializers.IntegerField(read_only=True)

    class Meta(StorefrontProductListSerializer.Meta):
        fields = StorefrontProductListSerializer.Meta.fields + ["total_sold"]


class StorefrontCultivationStepSerializer(serializers.ModelSerializer):
    """Một bước quy trình canh tác — buyer xem trên chi tiết sản phẩm."""

    class Meta:
        model = CultivationProcess
        fields = ["id", "step_order", "process_name", "description"]


class StorefrontProductDetailSerializer(StorefrontProductListSerializer):
    """Chi tiết sản phẩm — thêm bảo quản và quy trình canh tác từ NCC gốc."""

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
    cultivation_processes = StorefrontCultivationStepSerializer(
        source="supplier_product.cultivation_processes",
        many=True,
        read_only=True,
    )

    class Meta(StorefrontProductListSerializer.Meta):
        fields = StorefrontProductListSerializer.Meta.fields + [
            "supplier_product_name",
            "supplier_name",
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
            "cultivation_processes",
        ]

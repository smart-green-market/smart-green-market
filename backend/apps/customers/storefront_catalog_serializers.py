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
    effective_price = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_age_discount = serializers.SerializerMethodField()
    nearest_expiry_date = serializers.SerializerMethodField()
    age_discount_reason = serializers.SerializerMethodField()

    class Meta:
        model = DealerProduct
        fields = [
            "id",
            "title",
            "description",
            "retail_price",
            "effective_price",
            "discount_amount",
            "discount_percent",
            "has_age_discount",
            "nearest_expiry_date",
            "age_discount_reason",
            "thumbnail",
            "category",
            "unit",
            "available_quantity",
            "in_stock",
            "created_at",
            "updated_at",
            "images",
        ]

    def _pricing(self, instance):
        cached = getattr(instance, "_storefront_pricing", None)
        if cached is None:
            from apps.dealer_products.age_discount import product_display_price_to_dict

            cached = product_display_price_to_dict(instance)
            instance._storefront_pricing = cached
        return cached

    def get_effective_price(self, instance):
        return self._pricing(instance)["effective_price"]

    def get_discount_amount(self, instance):
        return self._pricing(instance)["discount_amount"]

    def get_discount_percent(self, instance):
        return self._pricing(instance)["discount_percent"]

    def get_has_age_discount(self, instance):
        return self._pricing(instance)["has_age_discount"]

    def get_nearest_expiry_date(self, instance):
        return self._pricing(instance)["nearest_expiry_date"]

    def get_age_discount_reason(self, instance):
        return self._pricing(instance)["age_discount_reason"]

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

    production_date = serializers.SerializerMethodField(
        help_text="Ngày sản xuất lô FIFO buyer sẽ nhận (lưu trên lô tồn kho)",
    )
    expiry_date = serializers.SerializerMethodField(
        help_text="Ngày hết hạn lô FIFO buyer sẽ nhận",
    )
    days_to_expiry = serializers.SerializerMethodField(
        help_text="Số ngày còn lại đến hạn (tính từ hôm nay)",
    )
    supplier_product_name = serializers.CharField(
        source="supplier_product.name",
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

    def _batch_dates(self, instance):
        cached = getattr(instance, "_storefront_batch_dates", None)
        if cached is None:
            from apps.dealer_products.inventory_queries import (
                sellable_batch_dates_for_display,
            )

            cached = sellable_batch_dates_for_display(instance)
            instance._storefront_batch_dates = cached
        return cached

    def get_production_date(self, instance):
        return self._batch_dates(instance)["production_date"]

    def get_expiry_date(self, instance):
        return self._batch_dates(instance)["expiry_date"]

    def get_days_to_expiry(self, instance):
        return self._batch_dates(instance)["days_to_expiry"]

    class Meta(StorefrontProductListSerializer.Meta):
        fields = StorefrontProductListSerializer.Meta.fields + [
            "production_date",
            "expiry_date",
            "days_to_expiry",
            "supplier_product_name",
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
            "cultivation_processes",
        ]

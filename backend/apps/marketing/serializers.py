"""Serializer API tương tác buyer trên storefront."""

from rest_framework import serializers

from common.openapi_enums import schema_choice_field

from .models import CustomerSegment, CustomerSegmentMember, CustomerSegmentationHistory
from .services import STOREFRONT_TRACK_ACTIONS


class InteractionTrackSerializer(serializers.Serializer):
    dealer_product_id = serializers.IntegerField(
        help_text="ID sản phẩm trên gian hàng (`DealerProduct.id` từ catalog)",
    )
    action = schema_choice_field(
        choices=[(value, value) for value in sorted(STOREFRONT_TRACK_ACTIONS)],
        help_text="`view` — xem/click SP (+2). `add_cart` — thêm giỏ lần đầu (+3).",
    )


class InteractionTrackResponseSerializer(serializers.Serializer):
    recorded = serializers.BooleanField(
        help_text="true nếu đã ghi nhận hành động; false nếu debounce hoặc đã add cart trước đó",
    )
    action = serializers.CharField()
    reason = serializers.CharField(
        allow_null=True,
        required=False,
        help_text="`view_debounced` | `add_cart_already_recorded` khi recorded=false",
    )
    retry_after_seconds = serializers.IntegerField(
        allow_null=True,
        required=False,
        help_text="Còn bao nhiêu giây mới ghi nhận view tiếp theo (khi debounce)",
    )
    view_count = serializers.IntegerField()
    add_cart_count = serializers.IntegerField()
    purchase_count = serializers.IntegerField()
    engagement_score = serializers.IntegerField(
        help_text="view×2 + add_cart×3 + purchase×5",
    )


class DealerCatalogInteractionTrackSerializer(serializers.Serializer):
    supplier_product_id = serializers.IntegerField(
        help_text="ID sản phẩm NCC (`SupplierProduct.id` từ catalog)",
    )
    action = schema_choice_field(
        choices=[(value, value) for value in sorted({"view", "add_cart"})],
        help_text="`view` — xem/click SP (+2). `add_cart` — thêm giỏ lần đầu (+3).",
    )


class CustomerSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerSegment
        fields = [
            "id",
            "code",
            "name",
            "description",
            "is_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at"]


class CustomerProfileSegmentSerializer(serializers.ModelSerializer):
    """Segment của buyer trên hồ sơ /me — gộp thông tin membership."""

    id = serializers.IntegerField(source="segment.id", read_only=True)
    code = serializers.CharField(source="segment.code", read_only=True)
    name = serializers.CharField(source="segment.name", read_only=True)
    description = serializers.CharField(source="segment.description", read_only=True)
    is_system = serializers.BooleanField(source="segment.is_system", read_only=True)
    joined_at = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = CustomerSegmentMember
        fields = [
            "id",
            "code",
            "name",
            "description",
            "is_system",
            "joined_at",
        ]
        read_only_fields = fields
class DealerSegmentationHistorySerializer(serializers.ModelSerializer):
    """Serializer trả về 5 phiên gần nhất phục vụ vẽ biểu đồ miền (Area Chart)"""
    formatted_created_at = serializers.SerializerMethodField()

    class Meta:
        model = CustomerSegmentationHistory
        fields = [
            "id",
            "total_customers",
            "vip_count",
            "potential_count",
            "passive_count",
            "risk_count",
            "silhouette_score",
            "created_at",
            "formatted_created_at"
        ]

    def get_formatted_created_at(self, obj):
        return obj.created_at.strftime("%d/%m/%Y %H:%M")


class AdminSegmentationHistorySerializer(serializers.ModelSerializer):
    """Serializer phục vụ admin giám sát hiệu năng Silhouette Score của toàn hệ thống"""
    formatted_created_at = serializers.SerializerMethodField()

    class Meta:
        model = CustomerSegmentationHistory
        fields = [
            "id",
            "dealer_id",
            "silhouette_score",
            "total_customers",
            "created_at",
            "formatted_created_at"
        ]

    def get_formatted_created_at(self, obj):
        return obj.created_at.strftime("%d/%m/%Y %H:%M")

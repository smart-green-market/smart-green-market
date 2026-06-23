"""Serializer API tương tác buyer trên storefront."""

from rest_framework import serializers

from common.openapi_enums import schema_choice_field

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

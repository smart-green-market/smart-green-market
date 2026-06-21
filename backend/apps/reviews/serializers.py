"""Serializer đánh giá sản phẩm."""

from rest_framework import serializers

from common.files import build_media_url
from common.validators import validate_image_upload

from . import services
from .models import ProductReview, ReviewImage


def _collect_upload_files(request):
    return request.FILES.getlist("images")


class ReviewImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(
        help_text="URL ảnh đầy đủ",
    )

    class Meta:
        model = ReviewImage
        fields = ["id", "image_url", "created_at"]
        extra_kwargs = {
            "id": {"help_text": "ID ảnh review"},
            "created_at": {"help_text": "Thời điểm upload"},
        }

    def get_image_url(self, obj):
        url = build_media_url(obj.image, self.context.get("request")) if obj.image else obj.image_url
        return url or None


class ProductReviewListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField(
        help_text="Tên buyer",
    )
    dealer_product_id = serializers.IntegerField(source="dealer_product.id", read_only=True)
    product_title = serializers.CharField(source="dealer_product.title", read_only=True)
    order_code = serializers.CharField(source="order.order_code", read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    is_mine = serializers.SerializerMethodField(
        help_text="true nếu review thuộc buyer đang đăng nhập",
    )

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "dealer_product_id",
            "product_title",
            "order_id",
            "order_code",
            "customer_name",
            "rating",
            "comment",
            "images",
            "is_mine",
            "created_at",
            "updated_at",
        ]

    def get_is_mine(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, "customer_profile"):
            return False
        return obj.customer_profile_id == request.user.customer_profile.id

    def get_customer_name(self, obj):
        user = obj.customer_profile.user
        return user.full_name or user.username


class ProductReviewDetailSerializer(ProductReviewListSerializer):
    class Meta(ProductReviewListSerializer.Meta):
        fields = ProductReviewListSerializer.Meta.fields


class ProductReviewSummarySerializer(serializers.Serializer):
    dealer_product_id = serializers.IntegerField()
    review_count = serializers.IntegerField()
    average_rating = serializers.FloatField(allow_null=True)
    rating_distribution = serializers.DictField(
        child=serializers.IntegerField(),
        help_text="Số review theo sao 1–5",
    )


class PendingReviewItemSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    order_code = serializers.CharField()
    dealer_product_id = serializers.IntegerField()
    product_title = serializers.CharField()
    completed_at = serializers.DateTimeField(allow_null=True)


class ProductReviewCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(
        help_text="ID đơn hàng đã completed — buyer phải là chủ đơn",
    )
    dealer_product_id = serializers.IntegerField(
        help_text="ID sản phẩm trên gian hàng (DealerProduct)",
    )
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        request = self.context["request"]
        files = _collect_upload_files(request)
        for file in files:
            validate_image_upload(file)
        if len(files) > services.MAX_IMAGES_PER_REVIEW:
            raise serializers.ValidationError(
                {"images": f"Tối đa {services.MAX_IMAGES_PER_REVIEW} ảnh/review."}
            )
        attrs["images"] = files
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        dealer = self.context["dealer"]
        images = validated_data.pop("images", [])
        return services.create_product_review(
            customer=request.user.customer_profile,
            dealer=dealer,
            image_files=images,
            **validated_data,
        )


class ProductReviewUpdateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Cần ít nhất rating hoặc comment.")
        return attrs

    def update(self, instance, validated_data):
        return services.update_product_review(
            review=instance,
            rating=validated_data.get("rating"),
            comment=validated_data.get("comment"),
        )


class ReviewImageUploadSerializer(serializers.Serializer):
    def validate(self, attrs):
        request = self.context["request"]
        files = _collect_upload_files(request)
        if not files:
            raise serializers.ValidationError(
                {"images": "Cần ít nhất một ảnh (field `images`)."}
            )
        for file in files:
            validate_image_upload(file)
        attrs["images"] = files
        return attrs

    def create(self, validated_data):
        review = self.context["review"]
        return services.add_review_images(
            review=review,
            image_files=validated_data["images"],
        )

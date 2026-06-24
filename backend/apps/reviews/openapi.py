"""OpenAPI helpers — đánh giá sản phẩm."""

from drf_spectacular.utils import OpenApiExample, inline_serializer
from rest_framework import serializers

from common.openapi_files import RECEIPT_FILE_HELP

STOREFRONT_REVIEWS_TAG_DESCRIPTION = (
    "**Đánh giá sản phẩm** sau khi buyer nhận hàng (`order.status = completed`).\n\n"
    "### Luồng UI\n"
    "1. `GET .../me/pending-reviews/` — SP chưa đánh giá\n"
    "2. `POST .../reviews/` — tạo review (multipart: rating + ảnh)\n"
    "3. `GET .../products/{id}/reviews/` + `.../summary/` — hiển thị trên trang SP\n"
    "4. `PATCH/DELETE .../reviews/{id}/` — sửa/xóa review của mình\n\n"
    "Mỗi cặp `(order, dealer_product)` chỉ review **1 lần**."
)

ReviewCreateForm = inline_serializer(
    name="StorefrontReviewCreateForm",
    fields={
        "order_id": serializers.IntegerField(),
        "dealer_product_id": serializers.IntegerField(),
        "rating": serializers.IntegerField(min_value=1, max_value=5),
        "comment": serializers.CharField(required=False, allow_blank=True),
        "images": serializers.ListField(
            child=serializers.FileField(help_text=RECEIPT_FILE_HELP),
            required=False,
        ),
    },
)

ReviewImagesUploadForm = inline_serializer(
    name="StorefrontReviewImagesUploadForm",
    fields={
        "images": serializers.ListField(
            child=serializers.FileField(help_text=RECEIPT_FILE_HELP),
        ),
    },
)

REVIEW_CREATE_EXAMPLE = OpenApiExample(
    "Tạo review (chọn file images trên Swagger)",
    value={
        "order_id": 10,
        "dealer_product_id": 5,
        "rating": 5,
        "comment": "Rau tươi, giao nhanh",
    },
    request_only=True,
)

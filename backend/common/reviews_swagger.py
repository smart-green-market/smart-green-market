"""Mô tả tag Swagger Reviews — không import Django apps."""

STOREFRONT_REVIEWS_TAG_DESCRIPTION = (
    "Đánh giá sản phẩm sau đơn **completed**. Prefix: `/api/storefronts/{dealer_slug}/`.\n\n"
    "Buyer: pending-reviews → POST reviews (multipart) → PATCH/DELETE review.\n"
    "Public: GET products/{id}/reviews/ + summary."
)

DEALER_PRODUCT_REVIEWS_TAG_DESCRIPTION = (
    "Đại lý xem đánh giá trên sản phẩm cửa hàng. "
    "`GET /api/dealer-product-reviews/` — lọc `dealer_product_id`, `rating`, `order_id`."
)

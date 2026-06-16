"""Đánh giá sản phẩm và gợi ý cá nhân hóa trên gian hàng đại lý."""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class RecommendationType(models.TextChoices):
    """Loại gợi ý sản phẩm."""

    SIMILAR_PRODUCT = "similar_product", "Sản phẩm tương tự"
    FREQUENTLY_BOUGHT = "frequently_bought", "Thường mua cùng"
    PERSONALIZED = "personalized", "Cá nhân hóa"
    SEGMENT_BASED = "segment_based", "Theo nhóm khách"


class ProductReview(models.Model):
    """Đánh giá sản phẩm sau khi mua hàng."""

    customer_profile = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )
    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )
    dealer_product = models.ForeignKey(
        "dealer_products.DealerProduct",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="product_reviews",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product_reviews"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer_profile", "dealer_product", "order"],
                name="unique_product_review_per_order",
            ),
        ]
        indexes = [
            models.Index(fields=["dealer_product", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.dealer_product.title} — {self.rating}★"


class ReviewImage(models.Model):
    """Ảnh đính kèm đánh giá sản phẩm."""

    review = models.ForeignKey(
        ProductReview,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.FileField(upload_to="review_images/", blank=True)
    image_url = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_images"
        ordering = ["id"]

    def __str__(self):
        return f"Ảnh review #{self.review_id}"


class ProductRecommendation(models.Model):
    """Kết quả gợi ý sản phẩm (cache) — tính toán định kỳ bởi service."""

    customer = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="product_recommendations",
    )
    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="product_recommendations",
    )
    dealer_product = models.ForeignKey(
        "dealer_products.DealerProduct",
        on_delete=models.CASCADE,
        related_name="recommendations",
    )

    score = models.DecimalField(max_digits=8, decimal_places=4)
    recommendation_type = models.CharField(
        max_length=30,
        choices=RecommendationType.choices,
    )
    expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product_recommendations"
        ordering = ["-score", "-updated_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "dealer_product", "recommendation_type"],
                name="unique_product_recommendation",
            ),
        ]
        indexes = [
            models.Index(fields=["customer", "recommendation_type", "-score"]),
        ]

    def __str__(self):
        return f"{self.customer} ← {self.dealer_product.title} ({self.score})"

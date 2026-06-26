"""Logic nghiệp vụ đánh giá sản phẩm trên gian hàng đại lý."""

from django.db import transaction
from django.db.models import Avg, Count
from rest_framework.exceptions import ValidationError

from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.orders.models import Order, OrderStatus

from .models import ProductReview, ReviewImage

MAX_IMAGES_PER_REVIEW = 5


def get_product_reviews_queryset(*, dealer=None, dealer_product_id=None):
    qs = ProductReview.objects.select_related(
        "customer_profile__user",
        "dealer_product",
        "order",
        "dealer",
    ).prefetch_related("images")
    if dealer is not None:
        qs = qs.filter(dealer=dealer)
    if dealer_product_id is not None:
        qs = qs.filter(dealer_product_id=dealer_product_id)
    return qs


def _aggregate_review_summary(qs) -> dict:
    agg = qs.aggregate(
        average_rating=Avg("rating"),
        review_count=Count("id"),
    )
    distribution = {star: 0 for star in range(1, 6)}
    for row in qs.values("rating").annotate(count=Count("id")):
        distribution[row["rating"]] = row["count"]

    average = agg["average_rating"]
    return {
        "review_count": agg["review_count"] or 0,
        "average_rating": round(float(average), 2) if average is not None else None,
        "rating_distribution": distribution,
    }


def get_dealer_review_summary(*, dealer) -> dict:
    """Tổng hợp rating toàn gian hàng — trang About."""
    return _aggregate_review_summary(ProductReview.objects.filter(dealer=dealer))


def get_review_summary(*, dealer, dealer_product_id: int) -> dict:
    """Tổng hợp rating cho một sản phẩm."""
    qs = ProductReview.objects.filter(
        dealer=dealer,
        dealer_product_id=dealer_product_id,
    )
    summary = _aggregate_review_summary(qs)
    return {"dealer_product_id": dealer_product_id, **summary}


def _resolve_dealer_product(*, dealer, dealer_product_id: int) -> DealerProduct:
    try:
        product = DealerProduct.objects.get(pk=dealer_product_id, dealer_profile=dealer)
    except DealerProduct.DoesNotExist as exc:
        raise ValidationError({"dealer_product_id": "Sản phẩm không thuộc cửa hàng này."}) from exc
    if product.status != DealerProductStatus.ACTIVE:
        raise ValidationError({"dealer_product_id": "Sản phẩm không còn bán."})
    return product


def _resolve_completed_order(*, customer, dealer, order_id: int) -> Order:
    try:
        order = Order.objects.get(pk=order_id, customer=customer, dealer=dealer)
    except Order.DoesNotExist as exc:
        raise ValidationError({"order_id": "Đơn hàng không tồn tại hoặc không thuộc tài khoản."}) from exc
    if order.status != OrderStatus.COMPLETED:
        raise ValidationError({"order_id": "Chỉ đánh giá sau khi đơn hàng hoàn tất (completed)."})
    return order


def _ensure_product_in_order(*, order, dealer_product) -> None:
    if not order.items.filter(dealer_product=dealer_product).exists():
        raise ValidationError(
            {"dealer_product_id": "Sản phẩm không có trong đơn hàng đã chọn."}
        )


def _validate_image_count(review, new_count: int) -> None:
    current = review.images.count()
    if current + new_count > MAX_IMAGES_PER_REVIEW:
        raise ValidationError(
            {
                "images": (
                    f"Tối đa {MAX_IMAGES_PER_REVIEW} ảnh/review "
                    f"(hiện có {current}, thêm {new_count})."
                )
            }
        )


@transaction.atomic
def create_product_review(
    *,
    customer,
    dealer,
    order_id: int,
    dealer_product_id: int,
    rating: int,
    comment: str = "",
    image_files=None,
) -> ProductReview:
    """Buyer tạo đánh giá sau đơn completed."""
    order = _resolve_completed_order(customer=customer, dealer=dealer, order_id=order_id)
    dealer_product = _resolve_dealer_product(dealer=dealer, dealer_product_id=dealer_product_id)
    _ensure_product_in_order(order=order, dealer_product=dealer_product)

    if ProductReview.objects.filter(
        customer_profile=customer,
        dealer_product=dealer_product,
        order=order,
    ).exists():
        raise ValidationError(
            {"detail": "Bạn đã đánh giá sản phẩm này cho đơn hàng này."}
        )

    image_files = list(image_files or [])
    if len(image_files) > MAX_IMAGES_PER_REVIEW:
        raise ValidationError(
            {"images": f"Tối đa {MAX_IMAGES_PER_REVIEW} ảnh/review."}
        )

    review = ProductReview.objects.create(
        customer_profile=customer,
        dealer=dealer,
        dealer_product=dealer_product,
        order=order,
        rating=rating,
        comment=comment or "",
    )
    for file in image_files:
        ReviewImage.objects.create(review=review, image=file)
    return review


@transaction.atomic
def update_product_review(*, review, rating=None, comment=None) -> ProductReview:
    update_fields = ["updated_at"]
    if rating is not None:
        review.rating = rating
        update_fields.append("rating")
    if comment is not None:
        review.comment = comment
        update_fields.append("comment")
    if len(update_fields) > 1:
        review.save(update_fields=update_fields)
    return review


@transaction.atomic
def delete_product_review(review) -> None:
    for image in review.images.all():
        if image.image:
            image.image.delete(save=False)
    review.delete()


@transaction.atomic
def add_review_images(*, review, image_files) -> list[ReviewImage]:
    files = list(image_files or [])
    if not files:
        raise ValidationError({"images": "Cần ít nhất một ảnh."})
    _validate_image_count(review, len(files))
    created = []
    for file in files:
        created.append(ReviewImage.objects.create(review=review, image=file))
    return created


def delete_review_image(*, review, image_id: int) -> None:
    try:
        image = review.images.get(pk=image_id)
    except ReviewImage.DoesNotExist as exc:
        raise ValidationError({"image_id": "Ảnh không thuộc đánh giá này."}) from exc
    if image.image:
        image.image.delete(save=False)
    image.delete()


def get_pending_review_items(*, customer, dealer):
    """SP trong đơn completed chưa được buyer đánh giá."""
    completed_orders = Order.objects.filter(
        customer=customer,
        dealer=dealer,
        status=OrderStatus.COMPLETED,
    ).prefetch_related("items__dealer_product")

    pending = []
    for order in completed_orders:
        reviewed_product_ids = set(
            ProductReview.objects.filter(
                customer_profile=customer,
                order=order,
            ).values_list("dealer_product_id", flat=True)
        )
        seen = set()
        for item in order.items.all():
            pid = item.dealer_product_id
            if pid in reviewed_product_ids or pid in seen:
                continue
            seen.add(pid)
            pending.append(
                {
                    "order_id": order.id,
                    "order_code": order.order_code,
                    "dealer_product_id": pid,
                    "product_title": item.product_title,
                    "completed_at": order.completed_at,
                }
            )
    return pending

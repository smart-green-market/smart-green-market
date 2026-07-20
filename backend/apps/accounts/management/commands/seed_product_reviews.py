"""Seed đánh giá sản phẩm cho đơn completed — chủ yếu dealer 01, ít dealer 02."""

from __future__ import annotations

from apps.dealers.models import DealerProfile
from apps.orders.models import Order, OrderStatus
from apps.reviews.models import ProductReview

SEED_REVIEW_COMMENTS: tuple[str, ...] = (
    "Sản phẩm rất tươi, chất lượng tốt và được đóng gói cẩn thận.",
    "Giao hàng đúng giờ, sản phẩm còn nguyên vẹn và sạch sẽ.",
    "Chất lượng khá tốt, đúng với mô tả trên cửa hàng.",
    "Sản phẩm tươi, không bị dập hay hư hỏng.",
    "Đóng gói chắc chắn, số lượng đầy đủ và giao nhanh.",
    "Sản phẩm có chất lượng tốt, sẽ tiếp tục ủng hộ cửa hàng.",
    "Hàng khá tươi, giá cả hợp lý và phục vụ tốt.",
    "Sản phẩm sạch sẽ, hình thức đẹp và dễ sử dụng.",
    "Giao hàng nhanh, nhân viên hỗ trợ nhiệt tình.",
    "Chất lượng ổn định, phù hợp với giá tiền.",
    "Sản phẩm còn tươi, màu sắc đẹp và không có mùi lạ.",
    "Hàng nhận được đúng số lượng và đúng như hình ảnh.",
    "Sản phẩm tốt, đóng gói gọn gàng và sạch sẽ.",
    "Chất lượng khá ổn, tuy nhiên có một ít sản phẩm bị dập nhẹ.",
    "Sản phẩm tươi ngon, gia đình tôi rất hài lòng.",
    "Giao hàng đúng thời gian đã đặt, sản phẩm được bảo quản tốt.",
    "Hàng sạch, tươi và có nguồn gốc rõ ràng.",
    "Sản phẩm đạt chất lượng, không phát hiện hư hỏng.",
    "Cửa hàng chuẩn bị hàng nhanh và đóng gói rất kỹ.",
    "Sản phẩm sử dụng tốt, chất lượng đúng như mong đợi.",
    "Hàng khá tươi nhưng kích thước chưa được đồng đều.",
    "Chất lượng tốt, giá phù hợp và giao hàng thuận tiện.",
    "Sản phẩm sạch sẽ, không bị úng hoặc héo.",
    "Lần đầu mua nhưng khá hài lòng với chất lượng sản phẩm.",
    "Sản phẩm tươi, trọng lượng đầy đủ và đóng gói đẹp.",
    "Hàng đúng mô tả, chất lượng ổn và giao nhanh.",
    "Sản phẩm ngon, dễ chế biến và vẫn giữ được độ tươi.",
    "Chất lượng nhìn chung tốt, cửa hàng phục vụ chu đáo.",
    "Sản phẩm được lựa chọn kỹ, không có nhiều phần bị hỏng.",
    "Rất hài lòng, sản phẩm tươi và trải nghiệm mua hàng tốt.",
)

DEALER_01_REVIEW_TARGET = 25
DEALER_02_REVIEW_TARGET = 5

_FOUR_STAR_COMMENT_INDEXES = {13, 20}


def _rating_for_comment_index(index: int) -> int:
    return 4 if index in _FOUR_STAR_COMMENT_INDEXES else 5


def _primary_line_dealer_product_id(order: Order) -> int | None:
    item = order.items.order_by("id").first()
    return item.dealer_product_id if item else None


def _create_review(
    *,
    order: Order,
    dealer_product_id: int,
    comment_index: int,
) -> bool:
    if not order.items.filter(dealer_product_id=dealer_product_id).exists():
        return False
    if ProductReview.objects.filter(
        customer_profile=order.customer,
        dealer_product_id=dealer_product_id,
        order=order,
    ).exists():
        return False

    review = ProductReview.objects.create(
        customer_profile=order.customer,
        dealer=order.dealer,
        dealer_product_id=dealer_product_id,
        order=order,
        rating=_rating_for_comment_index(comment_index),
        comment=SEED_REVIEW_COMMENTS[comment_index],
    )
    ts = order.completed_at or order.created_at
    if ts:
        ProductReview.objects.filter(pk=review.pk).update(created_at=ts, updated_at=ts)
    return True


def _seed_dealer_reviews(
    dealer: DealerProfile,
    *,
    target_count: int,
    comment_index: int,
) -> tuple[int, int]:
    """Returns (reviews_created, next_comment_index)."""
    created = 0
    orders = (
        Order.objects.filter(dealer=dealer, status=OrderStatus.COMPLETED)
        .order_by("id")
        .prefetch_related("items")
    )
    for order in orders:
        if created >= target_count:
            break
        if comment_index >= len(SEED_REVIEW_COMMENTS):
            break
        product_id = _primary_line_dealer_product_id(order)
        if product_id is None:
            continue
        if _create_review(
            order=order,
            dealer_product_id=product_id,
            comment_index=comment_index,
        ):
            created += 1
            comment_index += 1
    return created, comment_index


def seed_product_reviews(dealers: list[DealerProfile]) -> dict[str, int]:
    """Một review/đơn completed: 25 đại lý 01, 5 đại lý 02 (30 câu mẫu)."""
    stats = {"reviews": 0, "dealer_01": 0, "dealer_02": 0}
    if not dealers:
        return stats

    comment_index = 0
    d1_count, comment_index = _seed_dealer_reviews(
        dealers[0],
        target_count=DEALER_01_REVIEW_TARGET,
        comment_index=comment_index,
    )
    stats["dealer_01"] = d1_count
    stats["reviews"] += d1_count

    if len(dealers) > 1:
        d2_count, comment_index = _seed_dealer_reviews(
            dealers[1],
            target_count=DEALER_02_REVIEW_TARGET,
            comment_index=comment_index,
        )
        stats["dealer_02"] = d2_count
        stats["reviews"] += d2_count

    return stats

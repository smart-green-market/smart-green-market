"""Seed đánh giá sản phẩm — dealer 01: 3 review/SP, dealer 02: 1 review/SP."""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.customers.models import CustomerAddress, CustomerProfile
from apps.dealer_products.models import DealerInventoryBatch, DealerProduct, DealerProductStatus
from apps.dealers.models import DealerProfile
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.reviews.models import ProductReview

from .seed_product_helpers import int_money

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

DEALER_01_REVIEWS_PER_PRODUCT = 3
DEALER_02_REVIEWS_PER_PRODUCT = 1

_FOUR_STAR_COMMENT_INDEXES = {13, 20}


def _rating_for_comment_index(index: int) -> int:
    return 4 if (index % len(SEED_REVIEW_COMMENTS)) in _FOUR_STAR_COMMENT_INDEXES else 5


def _dealer_buyers_with_address(dealer: DealerProfile) -> list[tuple[CustomerProfile, CustomerAddress]]:
    rows: list[tuple[CustomerProfile, CustomerAddress]] = []
    profiles = (
        CustomerProfile.objects.filter(user__store_dealer=dealer)
        .select_related("user")
        .order_by("id")
    )
    for profile in profiles:
        address = profile.addresses.order_by("id").first()
        if address:
            rows.append((profile, address))
    return rows


def _pick_batch(dealer_product: DealerProduct) -> DealerInventoryBatch | None:
    return (
        DealerInventoryBatch.objects.filter(
            dealer_product=dealer_product,
            remaining_quantity__gt=0,
        )
        .order_by("-import_date", "-id")
        .first()
    )


def _review_seed_order_code(dealer_index: int, product_id: int, slot: int) -> str:
    return f"ORD-D{dealer_index + 1:02d}RV{product_id}N{slot + 1:02d}"


def _orders_for_product(dealer: DealerProfile, dealer_product_id: int) -> list[Order]:
    return list(
        Order.objects.filter(
            dealer=dealer,
            status=OrderStatus.COMPLETED,
            items__dealer_product_id=dealer_product_id,
        )
        .distinct()
        .order_by("id")
    )


def _create_review_only_order(
    *,
    dealer: DealerProfile,
    dealer_index: int,
    dealer_product: DealerProduct,
    customer: CustomerProfile,
    address: CustomerAddress,
    slot: int,
) -> Order | None:
    batch = _pick_batch(dealer_product)
    if batch is None:
        return None

    order_code = _review_seed_order_code(dealer_index, dealer_product.id, slot)
    if Order.objects.filter(order_code=order_code).exists():
        return Order.objects.get(order_code=order_code)

    created_at = timezone.now() - timedelta(days=30 + (dealer_product.id % 20) + slot)
    delivered_at = created_at + timedelta(hours=4)
    completed_at = delivered_at + timedelta(hours=12)
    unit_price = int_money(dealer_product.retail_price)
    qty = 1
    subtotal = int_money(int(unit_price) * qty)

    order = Order.objects.create(
        order_code=order_code,
        customer=customer,
        dealer=dealer,
        customer_address=address,
        status=OrderStatus.COMPLETED,
        receiver_name=address.receiver_name,
        receiver_phone=address.receiver_phone,
        delivery_address=address.address,
        delivery_time=delivered_at,
        note="",
        delivered_at=delivered_at,
        completed_at=completed_at,
        cancelled_at=None,
        cancel_reason="",
        subtotal_amount=subtotal,
        total_amount=subtotal,
        paid_amount=subtotal,
        debt_amount=int_money(0),
        discount_amount=int_money(0),
        shipping_fee=int_money(0),
    )
    Order.objects.filter(pk=order.pk).update(created_at=created_at)

    OrderItem.objects.create(
        order=order,
        dealer_product=dealer_product,
        batch=batch,
        product_title=dealer_product.title,
        unit=dealer_product.supplier_product.unit,
        quantity=qty,
        unit_price=unit_price,
        import_price=int_money(batch.import_price),
        subtotal=subtotal,
    )
    return order


def _ensure_orders_for_product(
    *,
    dealer: DealerProfile,
    dealer_index: int,
    dealer_product: DealerProduct,
    needed: int,
    buyers: list[tuple[CustomerProfile, CustomerAddress]],
) -> list[Order]:
    orders = _orders_for_product(dealer, dealer_product.id)
    if len(orders) >= needed:
        return orders[:needed]

    if not buyers:
        return orders

    slot = len(orders)
    while len(orders) < needed:
        customer, address = buyers[(dealer_product.id + slot) % len(buyers)]
        extra = _create_review_only_order(
            dealer=dealer,
            dealer_index=dealer_index,
            dealer_product=dealer_product,
            customer=customer,
            address=address,
            slot=slot,
        )
        if extra is None:
            break
        if extra not in orders:
            orders.append(extra)
        slot += 1
        if slot > needed + 10:
            break
    return orders[:needed]


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

    idx = comment_index % len(SEED_REVIEW_COMMENTS)
    review = ProductReview.objects.create(
        customer_profile=order.customer,
        dealer=order.dealer,
        dealer_product_id=dealer_product_id,
        order=order,
        rating=_rating_for_comment_index(comment_index),
        comment=SEED_REVIEW_COMMENTS[idx],
    )
    ts = order.completed_at or order.created_at
    if ts:
        ProductReview.objects.filter(pk=review.pk).update(created_at=ts, updated_at=ts)
    return True


def _seed_dealer_product_reviews(
    *,
    dealer: DealerProfile,
    dealer_index: int,
    reviews_per_product: int,
    comment_index: int,
) -> tuple[int, int]:
    created = 0
    products = list(
        DealerProduct.objects.filter(
            dealer_profile=dealer,
            status=DealerProductStatus.ACTIVE,
        ).order_by("id")
    )
    buyers = _dealer_buyers_with_address(dealer)
    if not products:
        return 0, comment_index

    for dealer_product in products:
        orders = _ensure_orders_for_product(
            dealer=dealer,
            dealer_index=dealer_index,
            dealer_product=dealer_product,
            needed=reviews_per_product,
            buyers=buyers,
        )
        for order in orders[:reviews_per_product]:
            if _create_review(
                order=order,
                dealer_product_id=dealer_product.id,
                comment_index=comment_index,
            ):
                created += 1
                comment_index += 1
    return created, comment_index


def seed_product_reviews(dealers: list[DealerProfile]) -> dict[str, int]:
    stats = {
        "reviews": 0,
        "dealer_01": 0,
        "dealer_02": 0,
        "products_d1": 0,
        "products_d2": 0,
    }
    if not dealers:
        return stats

    comment_index = 0
    d1_count, comment_index = _seed_dealer_product_reviews(
        dealer=dealers[0],
        dealer_index=0,
        reviews_per_product=DEALER_01_REVIEWS_PER_PRODUCT,
        comment_index=comment_index,
    )
    stats["dealer_01"] = d1_count
    stats["reviews"] += d1_count
    stats["products_d1"] = DealerProduct.objects.filter(
        dealer_profile=dealers[0],
        status=DealerProductStatus.ACTIVE,
    ).count()

    if len(dealers) > 1:
        d2_count, comment_index = _seed_dealer_product_reviews(
            dealer=dealers[1],
            dealer_index=1,
            reviews_per_product=DEALER_02_REVIEWS_PER_PRODUCT,
            comment_index=comment_index,
        )
        stats["dealer_02"] = d2_count
        stats["reviews"] += d2_count
        stats["products_d2"] = DealerProduct.objects.filter(
            dealer_profile=dealers[1],
            status=DealerProductStatus.ACTIVE,
        ).count()

    return stats

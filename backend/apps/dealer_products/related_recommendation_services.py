"""Query và resolve gợi ý sản phẩm liên quan theo dealer_product."""

from apps.dealer_products.models import (
    DealerProductRelatedRecommendation,
    DealerProductStatus,
)


def parse_related_limit(raw, *, default=10, max_limit=20):
    """Parse query `limit` cho API sản phẩm liên quan."""
    try:
        value = int(raw) if raw is not None else default
    except (TypeError, ValueError):
        value = default
    return max(1, min(value, max_limit))


def normalize_related_product_ids(raw_ids):
    """Chuẩn hóa list ID — bỏ trùng, chỉ giữ số nguyên dương."""
    if not raw_ids:
        return []
    seen = set()
    normalized = []
    for raw in raw_ids:
        try:
            product_id = int(raw)
        except (TypeError, ValueError):
            continue
        if product_id <= 0 or product_id in seen:
            continue
        seen.add(product_id)
        normalized.append(product_id)
    return normalized


def get_related_recommendation_record(dealer_product):
    """Lấy bản ghi cache gợi ý — None nếu chưa có."""
    try:
        return dealer_product.related_recommendation
    except DealerProductRelatedRecommendation.DoesNotExist:
        return None


def resolve_storefront_related_products(
    dealer,
    source_product,
    *,
    limit=10,
    get_products_qs,
):
    """
    Trả sản phẩm liên quan active của cùng gian hàng, giữ thứ tự trong cache.
    Nếu chưa cấu hình hoặc list rỗng — fallback cùng danh mục.
    """
    record = get_related_recommendation_record(source_product)
    related_ids = normalize_related_product_ids(
        record.related_product_ids if record else []
    )

    if related_ids:
        products_by_id = {
            product.pk: product
            for product in get_products_qs(dealer).filter(pk__in=related_ids)
        }
        results = []
        for product_id in related_ids:
            if product_id == source_product.pk:
                continue
            product = products_by_id.get(product_id)
            if product is None:
                continue
            results.append(product)
            if len(results) >= limit:
                break
        if results:
            return results, record

    qs = get_products_qs(dealer).exclude(pk=source_product.pk)
    if source_product.category_id:
        qs = qs.filter(category_id=source_product.category_id)
    return list(qs[:limit]), record


def get_dealer_related_recommendations_qs(user):
    """Queryset gợi ý liên quan — admin xem tất cả, dealer chỉ SP của mình."""
    from common.querysets import filter_admin_or_dealer_account

    qs = DealerProductRelatedRecommendation.objects.select_related(
        "dealer_product",
        "dealer_product__dealer_profile",
        "dealer_product__dealer_profile__account",
    ).filter(dealer_product__status__in=[
        DealerProductStatus.ACTIVE,
        DealerProductStatus.INACTIVE,
        DealerProductStatus.PENDING,
    ])
    return filter_admin_or_dealer_account(
        qs,
        user,
        account_lookup="dealer_product__dealer_profile__account",
        ordering=("-updated_at", "-id"),
    )

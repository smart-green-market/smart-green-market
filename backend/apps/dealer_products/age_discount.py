"""Tính giá bán theo chính sách giảm giá đại lý."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from django.db.models import Min, Q
from django.utils import timezone

from .inventory_queries import get_sellable_batches_qs
from .models import DealerInventoryBatch, DealerProduct
from .models_age_discount import (
    AgeDiscountDiscountType,
    AgeDiscountPolicy,
    AgeDiscountScope,
)

AgeDiscountSource = Literal["manual", "policy", "none"]

_SCOPE_RANK = {
    AgeDiscountScope.DEALER_PRODUCT: 3,
    AgeDiscountScope.CATEGORY: 2,
    AgeDiscountScope.ALL: 1,
}


@dataclass(frozen=True)
class BatchAgeMetrics:
    age_days: int
    days_to_expiry: int | None
    shelf_life_total: int | None
    used_shelf_life_percent: Decimal | None


@dataclass(frozen=True)
class BatchPriceResult:
    base_retail_price: Decimal
    effective_unit_price: Decimal
    discount_amount: Decimal
    discount_percent: Decimal | None
    age_discount_source: AgeDiscountSource
    age_discount_reason: str
    applied_policy_id: int | None = None
    age_days: int | None = None
    days_to_expiry: int | None = None
    used_shelf_life_percent: Decimal | None = None


def compute_batch_age_metrics(batch, today=None) -> BatchAgeMetrics:
    today = today or timezone.localdate()
    age_days = max(0, (today - batch.import_date).days)
    days_to_expiry = None
    shelf_life_total = None
    used_shelf_life_percent = None

    if batch.expiry_date:
        days_to_expiry = (batch.expiry_date - today).days
        shelf_life_total = max(1, (batch.expiry_date - batch.import_date).days)
        used = (Decimal(age_days) / Decimal(shelf_life_total)) * Decimal("100")
        used_shelf_life_percent = used.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return BatchAgeMetrics(
        age_days=age_days,
        days_to_expiry=days_to_expiry,
        shelf_life_total=shelf_life_total,
        used_shelf_life_percent=used_shelf_life_percent,
    )


def _policy_in_date_range(policy, at):
    if policy.start_at and at < policy.start_at:
        return False
    if policy.end_at and at > policy.end_at:
        return False
    return policy.is_within_daily_time(at)


def _policy_applies_to_product(policy, dealer_product):
    if policy.scope == AgeDiscountScope.ALL:
        return True
    if policy.scope == AgeDiscountScope.CATEGORY:
        return (
            dealer_product.category_id is not None
            and policy.category_id == dealer_product.category_id
        )
    if policy.scope == AgeDiscountScope.DEALER_PRODUCT:
        return policy.dealer_product_id == dealer_product.id
    return False


def load_active_policies(dealer, at=None):
    at = at or timezone.now()
    return _load_active_policies(dealer, at)


def build_policies_cache_for_batches(batches, at=None):
    """Prefetch policies theo dealer — dùng khi serialize nhiều lô."""
    at = at or timezone.now()
    from apps.dealers.models import DealerProfile

    dealer_ids = {b.dealer_product.dealer_profile_id for b in batches}
    cache = {}
    for dealer in DealerProfile.objects.filter(id__in=dealer_ids):
        cache[dealer.id] = load_active_policies(dealer, at)
    return cache


def _load_active_policies(dealer, at):
    policies = list(
        AgeDiscountPolicy.objects.filter(
            dealer=dealer,
            is_active=True,
        )
        .filter(Q(start_at__isnull=True) | Q(start_at__lte=at))
        .filter(Q(end_at__isnull=True) | Q(end_at__gte=at))
        .select_related("category", "dealer_product")
    )
    return [policy for policy in policies if policy.is_within_daily_time(at)]


def resolve_age_discount_policy(
    dealer,
    dealer_product,
    *,
    at=None,
    policies=None,
):
    at = at or timezone.now()
    if policies is None:
        policies = _load_active_policies(dealer, at)

    candidates = [
        p
        for p in policies
        if _policy_applies_to_product(p, dealer_product) and _policy_in_date_range(p, at)
    ]
    if not candidates:
        return None

    return max(
        candidates,
        key=lambda p: (_SCOPE_RANK.get(p.scope, 0), p.priority, p.id),
    )


def _apply_policy_discount(base_price, policy):
    if policy.discount_type == AgeDiscountDiscountType.PERCENT:
        amount = base_price * policy.discount_value / Decimal("100")
    else:
        amount = policy.discount_value
    effective = base_price - amount
    return max(effective, Decimal("0"))


def _build_policy_reason(policy):
    if policy.discount_type == AgeDiscountDiscountType.PERCENT:
        return f"{policy.title} - giảm {policy.discount_value}%"
    return f"{policy.title} - giảm {policy.discount_value}đ"


def _finalize_price_result(
    *,
    base_price,
    effective,
    source,
    reason,
    metrics=None,
    policy_id=None,
):
    discount_amount = max(base_price - effective, Decimal("0"))
    discount_percent = None
    if base_price > 0 and discount_amount > 0:
        discount_percent = (discount_amount / base_price * Decimal("100")).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )
    return BatchPriceResult(
        base_retail_price=base_price,
        effective_unit_price=effective,
        discount_amount=discount_amount,
        discount_percent=discount_percent,
        age_discount_source=source,
        age_discount_reason=reason,
        applied_policy_id=policy_id,
        age_days=metrics.age_days if metrics else None,
        days_to_expiry=metrics.days_to_expiry if metrics else None,
        used_shelf_life_percent=metrics.used_shelf_life_percent if metrics else None,
    )


def compute_batch_effective_price(
    batch,
    *,
    today=None,
    at=None,
    policies=None,
) -> BatchPriceResult:
    """manual_sale_price > policy tier > retail_price."""
    dealer_product = batch.dealer_product
    base_price = dealer_product.retail_price
    metrics = compute_batch_age_metrics(batch, today=today)

    if batch.manual_sale_price is not None:
        effective = max(batch.manual_sale_price, Decimal("0"))
        return _finalize_price_result(
            base_price=base_price,
            effective=effective,
            source="manual",
            reason="Giá giảm thủ công",
            metrics=metrics,
        )

    dealer = dealer_product.dealer_profile
    policy = resolve_age_discount_policy(
        dealer,
        dealer_product,
        at=at,
        policies=policies,
    )
    if policy:
        effective = _apply_policy_discount(base_price, policy)
        return _finalize_price_result(
            base_price=base_price,
            effective=effective,
            source="policy",
            reason=_build_policy_reason(policy),
            metrics=metrics,
            policy_id=policy.id,
        )

    return _finalize_price_result(
        base_price=base_price,
        effective=base_price,
        source="none",
        reason="",
        metrics=metrics,
    )


def price_for_order_allocation(batch, quantity):
    """Giá đơn vị khi phân bổ FIFO — quantity reserved for future rules."""
    return compute_batch_effective_price(batch).effective_unit_price


def compute_product_display_price(dealer_product, *, today=None, at=None) -> BatchPriceResult:
    """Giá hiển thị catalog = lô FIFO đầu tiên (lô sẽ bán trước)."""
    base_price = dealer_product.retail_price
    first_batch = (
        get_sellable_batches_qs(dealer_product).select_related("dealer_product__dealer_profile").first()
    )
    if not first_batch:
        return _finalize_price_result(
            base_price=base_price,
            effective=base_price,
            source="none",
            reason="",
        )

    dealer = dealer_product.dealer_profile
    at = at or timezone.now()
    policies = _load_active_policies(dealer, at)
    return compute_batch_effective_price(
        first_batch,
        today=today,
        at=at,
        policies=policies,
    )


def nearest_sellable_expiry_date(dealer_product, *, today=None):
    today = today or timezone.localdate()
    agg = (
        get_sellable_batches_qs(dealer_product)
        .filter(expiry_date__isnull=False)
        .aggregate(nearest=Min("expiry_date"))
    )
    return agg.get("nearest")


def batch_price_to_dict(result: BatchPriceResult):
    return {
        "base_retail_price": result.base_retail_price,
        "effective_unit_price": result.effective_unit_price,
        "discount_amount": result.discount_amount,
        "discount_percent": result.discount_percent,
        "age_discount_source": result.age_discount_source,
        "age_discount_reason": result.age_discount_reason,
        "age_days": result.age_days,
        "days_to_expiry": result.days_to_expiry,
        "used_shelf_life_percent": result.used_shelf_life_percent,
    }


def product_display_price_to_dict(dealer_product, *, today=None, at=None):
    display = compute_product_display_price(dealer_product, today=today, at=at)
    return {
        "retail_price": display.base_retail_price,
        "effective_price": display.effective_unit_price,
        "discount_amount": display.discount_amount,
        "discount_percent": display.discount_percent,
        "has_age_discount": display.effective_unit_price < display.base_retail_price,
        "nearest_expiry_date": nearest_sellable_expiry_date(dealer_product, today=today),
        "age_discount_reason": display.age_discount_reason or None,
    }

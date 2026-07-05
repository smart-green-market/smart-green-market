"""Tính giá sỉ sau giảm theo số lượng đặt hàng."""

from dataclasses import dataclass
from decimal import Decimal

from django.utils import timezone

from .models_quantity_discount import (
    QuantityDiscountPolicy,
    QuantityDiscountScope,
    QuantityDiscountTier,
    QuantityDiscountType,
)

_SCOPE_RANK = {
    QuantityDiscountScope.SUPPLIER_PRODUCT: 3,
    QuantityDiscountScope.CATEGORY: 2,
    QuantityDiscountScope.ALL: 1,
}


@dataclass
class WholesalePriceResult:
    base_unit_price: Decimal
    effective_unit_price: Decimal
    discount_amount_per_unit: Decimal
    policy_id: int | None
    tier_id: int | None
    discount_type: str | None
    discount_value: Decimal | None
    min_quantity: Decimal | None


def _policy_matches_product(policy, product) -> bool:
    if policy.scope == QuantityDiscountScope.ALL:
        return True
    if policy.scope == QuantityDiscountScope.CATEGORY:
        return product.category_id == policy.category_id
    if policy.scope == QuantityDiscountScope.SUPPLIER_PRODUCT:
        return product.id == policy.supplier_product_id
    return False


def _policy_is_active_now(policy, at=None) -> bool:
    if not policy.is_active:
        return False
    now = at or timezone.now()
    if policy.start_at and now < policy.start_at:
        return False
    if policy.end_at and now > policy.end_at:
        return False
    return True


def _active_policies_for_product(product, at=None):
    qs = (
        QuantityDiscountPolicy.objects.filter(
            supplier_id=product.supplier_id,
            is_active=True,
        )
        .prefetch_related("tiers")
        .select_related("category", "supplier_product")
    )
    policies = [p for p in qs if _policy_is_active_now(p, at=at)]
    matching = [p for p in policies if _policy_matches_product(p, product)]
    matching.sort(
        key=lambda p: (
            _SCOPE_RANK.get(p.scope, 0),
            p.priority,
            p.id,
        ),
        reverse=True,
    )
    return matching


def _best_tier_for_quantity(policy, quantity: Decimal) -> QuantityDiscountTier | None:
    tiers = [
        tier
        for tier in policy.tiers.all()
        if tier.min_quantity <= quantity
    ]
    if not tiers:
        return None
    return max(tiers, key=lambda t: (t.min_quantity, t.sort_order, t.id))


def _apply_discount(base_price: Decimal, tier: QuantityDiscountTier) -> Decimal:
    if tier.discount_type == QuantityDiscountType.PERCENT:
        factor = Decimal("1") - tier.discount_value / Decimal("100")
        return (base_price * factor).quantize(Decimal("0.01"))
    return max(base_price - tier.discount_value, Decimal("0")).quantize(Decimal("0.01"))


def compute_wholesale_unit_price(product, quantity) -> WholesalePriceResult:
    """Tính đơn giá sỉ sau giảm theo số lượng đặt."""
    quantity = Decimal(quantity)
    base_price = product.wholesale_price or Decimal("0")

    if base_price <= 0 or quantity <= 0:
        return WholesalePriceResult(
            base_unit_price=base_price,
            effective_unit_price=base_price,
            discount_amount_per_unit=Decimal("0"),
            policy_id=None,
            tier_id=None,
            discount_type=None,
            discount_value=None,
            min_quantity=None,
        )

    for policy in _active_policies_for_product(product):
        tier = _best_tier_for_quantity(policy, quantity)
        if tier is None:
            continue
        effective = _apply_discount(base_price, tier)
        return WholesalePriceResult(
            base_unit_price=base_price,
            effective_unit_price=effective,
            discount_amount_per_unit=(base_price - effective).quantize(Decimal("0.01")),
            policy_id=policy.id,
            tier_id=tier.id,
            discount_type=tier.discount_type,
            discount_value=tier.discount_value,
            min_quantity=tier.min_quantity,
        )

    return WholesalePriceResult(
        base_unit_price=base_price,
        effective_unit_price=base_price,
        discount_amount_per_unit=Decimal("0"),
        policy_id=None,
        tier_id=None,
        discount_type=None,
        discount_value=None,
        min_quantity=None,
    )


def get_quantity_discount_tiers_for_product(product) -> list[dict]:
    """Trả về các bậc giảm áp dụng được cho sản phẩm (cho dealer xem trước)."""
    policies = _active_policies_for_product(product)
    if not policies:
        return []

    policy = policies[0]
    tiers = []
    for tier in policy.tiers.all().order_by("min_quantity", "sort_order", "id"):
        tiers.append({
            "id": tier.id,
            "min_quantity": tier.min_quantity,
            "discount_type": tier.discount_type,
            "discount_value": tier.discount_value,
            "policy_id": policy.id,
            "policy_title": policy.title,
        })
    return tiers

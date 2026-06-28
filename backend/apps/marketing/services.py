"""Ghi nhận tương tác buyer với sản phẩm trên gian hàng đại lý."""

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.dealer_products.models import DealerProduct, DealerProductStatus

from .interaction_core import (
    POINTS_ADD_CART,
    POINTS_PURCHASE,
    POINTS_VIEW,
    VIEW_DEBOUNCE_SECONDS,
    InteractionTrackResult,
    apply_purchase_increment,
    apply_track_action,
    compute_engagement_score,
)
from .models import CustomerInteraction

STOREFRONT_TRACK_ACTIONS = frozenset({"view", "add_cart"})

__all__ = [
    "POINTS_ADD_CART",
    "POINTS_PURCHASE",
    "POINTS_VIEW",
    "VIEW_DEBOUNCE_SECONDS",
    "InteractionTrackResult",
    "STOREFRONT_TRACK_ACTIONS",
    "compute_engagement_score",
    "resolve_storefront_dealer_product",
    "track_interaction",
    "track_purchase_interactions_for_order",
]


def _get_or_create_interaction(*, customer, dealer, dealer_product) -> CustomerInteraction:
    interaction, _ = CustomerInteraction.objects.get_or_create(
        customer=customer,
        dealer_product=dealer_product,
        defaults={"dealer": dealer},
    )
    if interaction.dealer_id != dealer.id:
        interaction.dealer = dealer
        interaction.save(update_fields=["dealer", "updated_at"])
    return interaction


def resolve_storefront_dealer_product(*, dealer, dealer_product_id: int) -> DealerProduct:
    try:
        product = DealerProduct.objects.select_related("dealer_profile").get(pk=dealer_product_id)
    except DealerProduct.DoesNotExist as exc:
        raise ValidationError({"dealer_product_id": "Sản phẩm không tồn tại."}) from exc
    if product.dealer_profile_id != dealer.id:
        raise ValidationError({"dealer_product_id": "Sản phẩm không thuộc cửa hàng này."})
    if product.status != DealerProductStatus.ACTIVE:
        raise ValidationError({"dealer_product_id": "Sản phẩm không còn bán."})
    return product


def track_interaction(*, customer, dealer, dealer_product_id: int, action: str) -> InteractionTrackResult:
    """Ghi nhận view (+2, debounce) hoặc add_cart (+3, tối đa 1 lần) từ storefront."""
    product = resolve_storefront_dealer_product(dealer=dealer, dealer_product_id=dealer_product_id)
    interaction = _get_or_create_interaction(customer=customer, dealer=dealer, dealer_product=product)
    return apply_track_action(interaction, action)


def track_purchase_interactions_for_order(*, customer, dealer, validated_items) -> None:
    """Cộng purchase_count (+5 điểm/SP) khi buyer đặt hàng thành công."""
    seen_product_ids: set[int] = set()

    for row in validated_items:
        product = row["dealer_product"]
        if product.id in seen_product_ids:
            continue
        seen_product_ids.add(product.id)

        interaction = _get_or_create_interaction(
            customer=customer,
            dealer=dealer,
            dealer_product=product,
        )
        apply_purchase_increment(interaction)

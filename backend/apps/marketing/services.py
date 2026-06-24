"""Ghi nhận tương tác buyer với sản phẩm trên gian hàng đại lý."""

from dataclasses import dataclass

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.dealer_products.models import DealerProduct, DealerProductStatus

from .models import CustomerInteraction

VIEW_DEBOUNCE_SECONDS = 300
POINTS_VIEW = 2
POINTS_ADD_CART = 3
POINTS_PURCHASE = 5

STOREFRONT_TRACK_ACTIONS = frozenset({"view", "add_cart"})


@dataclass(frozen=True)
class InteractionTrackResult:
    recorded: bool
    action: str
    reason: str | None
    retry_after_seconds: int | None
    view_count: int
    add_cart_count: int
    purchase_count: int
    engagement_score: int


def compute_engagement_score(interaction: CustomerInteraction) -> int:
    return (
        interaction.view_count * POINTS_VIEW
        + interaction.add_cart_count * POINTS_ADD_CART
        + interaction.purchase_count * POINTS_PURCHASE
    )


def _build_result(
    interaction: CustomerInteraction,
    *,
    recorded: bool,
    action: str,
    reason: str | None = None,
    retry_after_seconds: int | None = None,
) -> InteractionTrackResult:
    return InteractionTrackResult(
        recorded=recorded,
        action=action,
        reason=reason,
        retry_after_seconds=retry_after_seconds,
        view_count=interaction.view_count,
        add_cart_count=interaction.add_cart_count,
        purchase_count=interaction.purchase_count,
        engagement_score=compute_engagement_score(interaction),
    )


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
    if action not in STOREFRONT_TRACK_ACTIONS:
        raise ValidationError(
            {"action": "Chỉ hỗ trợ `view` hoặc `add_cart`. Purchase ghi nhận khi đặt hàng thành công."}
        )

    product = resolve_storefront_dealer_product(dealer=dealer, dealer_product_id=dealer_product_id)
    interaction = _get_or_create_interaction(customer=customer, dealer=dealer, dealer_product=product)
    now = timezone.now()

    if action == "view":
        if interaction.last_viewed_at is not None:
            elapsed = (now - interaction.last_viewed_at).total_seconds()
            if elapsed < VIEW_DEBOUNCE_SECONDS:
                retry_after = max(0, int(VIEW_DEBOUNCE_SECONDS - elapsed))
                return _build_result(
                    interaction,
                    recorded=False,
                    action=action,
                    reason="view_debounced",
                    retry_after_seconds=retry_after,
                )

        interaction.view_count += 1
        interaction.last_viewed_at = now
        interaction.save(update_fields=["view_count", "last_viewed_at", "updated_at"])
        return _build_result(interaction, recorded=True, action=action)

    if interaction.add_cart_count >= 1:
        return _build_result(
            interaction,
            recorded=False,
            action=action,
            reason="add_cart_already_recorded",
        )

    interaction.add_cart_count += 1
    interaction.last_added_at = now
    interaction.save(update_fields=["add_cart_count", "last_added_at", "updated_at"])
    return _build_result(interaction, recorded=True, action=action)


def track_purchase_interactions_for_order(*, customer, dealer, validated_items) -> None:
    """Cộng purchase_count (+5 điểm/SP) khi buyer đặt hàng thành công."""
    seen_product_ids: set[int] = set()
    now = timezone.now()

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
        interaction.purchase_count += 1
        interaction.last_purchased_at = now
        interaction.save(
            update_fields=["purchase_count", "last_purchased_at", "updated_at"]
        )

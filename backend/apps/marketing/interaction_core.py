"""Logic chung ghi nhận view / add_cart / purchase cho interaction aggregate."""

from dataclasses import dataclass

from django.utils import timezone
from rest_framework.exceptions import ValidationError

VIEW_DEBOUNCE_SECONDS = 300
POINTS_VIEW = 2
POINTS_ADD_CART = 3
POINTS_PURCHASE = 5

TRACK_ACTIONS = frozenset({"view", "add_cart"})


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


def compute_engagement_score(interaction) -> int:
    return (
        interaction.view_count * POINTS_VIEW
        + interaction.add_cart_count * POINTS_ADD_CART
        + interaction.purchase_count * POINTS_PURCHASE
    )


def _build_result(
    interaction,
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


def apply_track_action(interaction, action: str) -> InteractionTrackResult:
    """Cập nhật counters trên bản ghi interaction (view debounce, add_cart 1 lần)."""
    if action not in TRACK_ACTIONS:
        raise ValidationError(
            {"action": "Chỉ hỗ trợ `view` hoặc `add_cart`. Purchase ghi nhận khi đặt hàng thành công."}
        )

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


def apply_purchase_increment(interaction) -> None:
    """Cộng purchase_count (+1 lần mỗi lần gọi)."""
    now = timezone.now()
    interaction.purchase_count += 1
    interaction.last_purchased_at = now
    interaction.save(
        update_fields=["purchase_count", "last_purchased_at", "updated_at"]
    )

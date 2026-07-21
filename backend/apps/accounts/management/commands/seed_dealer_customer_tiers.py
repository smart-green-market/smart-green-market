"""Cấu hình số lượng khách hàng và nhóm mua hàng theo từng dealer (seed)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

TierKind = Literal["high", "medium", "passive"]

# Dealer 01: 100 KH; Dealer 02/03: 30 KH mỗi dealer
DEALER_BUYER_COUNTS = [100, 30, 30]

DEALER_TIER_SPLITS: list[dict[str, int]] = [
    {"high": 10, "medium": 20},  # Dealer 01
    {"high": 5, "medium": 5},  # Dealer 02
    {"high": 5, "medium": 5},  # Dealer 03
]

HIGH_ORDER_COUNT = (5, 10)
HIGH_ORDER_AMOUNT = (2_000_000, 3_000_000)
MEDIUM_ORDER_COUNT = (2, 3)
MEDIUM_ORDER_AMOUNT = (500_000, 1_000_000)


@dataclass(frozen=True)
class BuyerPurchaseTier:
    kind: TierKind
    order_count_range: tuple[int, int] | None = None
    order_amount_range: tuple[int, int] | None = None


@dataclass
class BuyerSeedSpec:
    profile: object  # CustomerProfile
    dealer: object  # DealerProfile
    dealer_index: int
    slot: int
    tier: BuyerPurchaseTier


def resolve_buyer_tier(dealer_index: int, slot: int) -> BuyerPurchaseTier:
    split = (
        DEALER_TIER_SPLITS[dealer_index]
        if dealer_index < len(DEALER_TIER_SPLITS)
        else {"high": 0, "medium": 0}
    )
    high = split["high"]
    medium = split["medium"]
    if slot < high:
        return BuyerPurchaseTier(
            "high",
            order_count_range=HIGH_ORDER_COUNT,
            order_amount_range=HIGH_ORDER_AMOUNT,
        )
    if slot < high + medium:
        return BuyerPurchaseTier(
            "medium",
            order_count_range=MEDIUM_ORDER_COUNT,
            order_amount_range=MEDIUM_ORDER_AMOUNT,
        )
    return BuyerPurchaseTier("passive")


def segment_code_for_tier(tier: BuyerPurchaseTier, *, slot: int) -> str:
    """Ánh xạ tier seed → 1 trong 4 segment hệ thống."""
    if tier.kind == "high":
        return "VIP"
    if tier.kind == "medium":
        return "POTENTIAL"
    # Khách chưa phát sinh giao dịch: phần lớn PASSIVE, ~25% CHURN_RISK để demo đủ 4 nhóm
    if slot % 4 == 3:
        return "CHURN_RISK"
    return "PASSIVE"

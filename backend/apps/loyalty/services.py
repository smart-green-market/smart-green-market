"""Logic nghiệp vụ điểm và hạng thành viên."""

from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from .models import (
    CustomerTierHistory,
    DealerLoyaltySettings,
    LoyaltyPointTransaction,
    LoyaltyPointTransactionType,
    LoyaltyTier,
)
from .notifications import (
    notify_loyalty_manual_adjustment,
    notify_loyalty_points_awarded,
    notify_loyalty_points_deducted,
    notify_loyalty_tier_changed,
)


def get_dealer_loyalty_settings(dealer):
    """Lấy hoặc tạo cấu hình tích điểm của đại lý."""
    settings_obj, _ = DealerLoyaltySettings.objects.get_or_create(dealer=dealer)
    return settings_obj


def compute_eligible_order_amount(order, *, include_shipping=False):
    """Số tiền dùng để quy đổi điểm (sau giảm giá, không gồm phí ship)."""
    if include_shipping:
        return order.total_amount
    return order.subtotal_amount - order.discount_amount


def compute_points_for_amount(amount, points_per_unit):
    if amount is None or points_per_unit <= 0:
        return 0
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    if amount <= 0:
        return 0
    return int(amount // Decimal(points_per_unit))


def resolve_tier_for_points(dealer, points):
    """Chọn hạng active có min_points lớn nhất nhưng không vượt quá điểm hiện tại."""
    return (
        LoyaltyTier.objects.filter(
            dealer=dealer,
            is_active=True,
            min_points__lte=points,
        )
        .order_by("-min_points", "-level", "-id")
        .first()
    )


def resolve_next_tier(dealer, current_tier):
    """Hạng active kế tiếp theo level."""
    if current_tier is None:
        return (
            LoyaltyTier.objects.filter(dealer=dealer, is_active=True)
            .order_by("level", "min_points", "id")
            .first()
        )
    return (
        LoyaltyTier.objects.filter(
            dealer=dealer,
            is_active=True,
            level__gt=current_tier.level,
        )
        .order_by("level", "min_points", "id")
        .first()
    )


def build_loyalty_status(customer):
    """Payload hạng/điểm/tiến độ cho API customer."""
    dealer = customer.user.store_dealer
    points = customer.loyalty_points
    current_tier = customer.current_tier
    if current_tier is None and dealer is not None:
        current_tier = resolve_tier_for_points(dealer, points)

    next_tier = resolve_next_tier(dealer, current_tier) if dealer else None
    remaining_points = None
    if next_tier is not None:
        remaining_points = max(next_tier.min_points - points, 0)

    return {
        "loyalty_points": points,
        "current_tier": current_tier,
        "next_tier": next_tier,
        "remaining_points": remaining_points,
        "message": (
            "Bạn đã đạt hạng cao nhất"
            if next_tier is None and current_tier is not None
            else ""
        ),
    }


def assign_base_tier_to_customer(customer_profile):
    """Gán hạng thấp nhất cho khách mới."""
    dealer = customer_profile.user.store_dealer
    if dealer is None:
        return None
    base_tier = resolve_tier_for_points(dealer, customer_profile.loyalty_points)
    if base_tier is None:
        return None
    if customer_profile.current_tier_id == base_tier.id:
        return base_tier
    customer_profile.current_tier = base_tier
    customer_profile.save(update_fields=["current_tier", "updated_at"])
    return base_tier


@transaction.atomic
def recalculate_customer_tiers_for_dealer(dealer, *, reason="Điều chỉnh cấu hình hạng"):
    """Tính lại hạng toàn bộ khách của đại lý sau khi đổi ngưỡng/vô hiệu hóa hạng."""
    from apps.customers.models import CustomerProfile

    profiles = (
        CustomerProfile.objects.filter(user__store_dealer=dealer)
        .select_for_update(of=("self",))
        .select_related("current_tier", "user")
    )

    for profile in profiles:
        sync_customer_tier(
            profile,
            reason=reason,
            actor=None,
            notify=False,
        )


def _is_credit_transaction(transaction_type):
    return transaction_type in {
        LoyaltyPointTransactionType.ORDER_REWARD,
        LoyaltyPointTransactionType.MANUAL_ADD,
    }


@transaction.atomic
def apply_points_change(
    customer,
    *,
    points,
    transaction_type,
    reason,
    order=None,
    created_by=None,
    notify=True,
):
    """Cộng hoặc trừ điểm, ghi ledger và đồng bộ hạng."""
    if points <= 0:
        return None

    dealer = customer.user.store_dealer
    if dealer is None:
        raise ValidationError({"detail": "Khách hàng chưa thuộc cửa hàng đại lý."})

    if (
        order is not None
        and transaction_type == LoyaltyPointTransactionType.ORDER_REWARD
        and LoyaltyPointTransaction.objects.filter(
            order=order,
            transaction_type=LoyaltyPointTransactionType.ORDER_REWARD,
        ).exists()
    ):
        return None

    balance_before = customer.loyalty_points
    if _is_credit_transaction(transaction_type):
        balance_after = balance_before + points
    else:
        balance_after = max(balance_before - points, 0)

    actual_change = balance_after - balance_before
    if actual_change == 0 and transaction_type not in {
        LoyaltyPointTransactionType.MANUAL_ADD,
        LoyaltyPointTransactionType.MANUAL_DEDUCT,
    }:
        return None

    customer.loyalty_points = balance_after
    customer.save(update_fields=["loyalty_points", "updated_at"])

    tx = LoyaltyPointTransaction.objects.create(
        customer_profile=customer,
        dealer=dealer,
        order=order,
        transaction_type=transaction_type,
        points=points,
        balance_before=balance_before,
        balance_after=balance_after,
        reason=reason or "",
        created_by=created_by,
    )

    sync_customer_tier(
        customer,
        reason=reason or "",
        actor=created_by,
        notify=notify,
    )

    if notify and created_by is not None:
        if transaction_type == LoyaltyPointTransactionType.MANUAL_ADD:
            notify_loyalty_manual_adjustment(customer, points, reason, created_by, added=True)
        elif transaction_type == LoyaltyPointTransactionType.MANUAL_DEDUCT:
            notify_loyalty_manual_adjustment(customer, points, reason, created_by, added=False)
    elif notify:
        if transaction_type == LoyaltyPointTransactionType.ORDER_REWARD:
            notify_loyalty_points_awarded(customer, order, points, created_by)
        elif transaction_type == LoyaltyPointTransactionType.RETURN_DEDUCTION:
            notify_loyalty_points_deducted(customer, order, points, created_by)

    return tx


@transaction.atomic
def sync_customer_tier(customer, *, reason, actor=None, notify=True):
    """Cập nhật hạng hiện tại và ghi lịch sử nếu thay đổi."""
    dealer = customer.user.store_dealer
    if dealer is None:
        return None

    new_tier = resolve_tier_for_points(dealer, customer.loyalty_points)
    old_tier = customer.current_tier
    old_tier_id = old_tier.id if old_tier else None
    new_tier_id = new_tier.id if new_tier else None

    if old_tier_id == new_tier_id:
        return None

    customer.current_tier = new_tier
    customer.save(update_fields=["current_tier", "updated_at"])

    CustomerTierHistory.objects.create(
        customer_profile=customer,
        old_tier=old_tier,
        new_tier=new_tier,
        reason=reason or "",
    )

    if notify:
        notify_loyalty_tier_changed(
            customer,
            old_tier=old_tier,
            new_tier=new_tier,
            reason=reason,
            actor=actor,
        )
    return new_tier


@transaction.atomic
def award_points_for_completed_order(order, *, actor=None):
    """Cộng điểm khi đơn chuyển sang completed."""
    settings_obj = get_dealer_loyalty_settings(order.dealer)
    if not settings_obj.is_active:
        return None

    eligible = compute_eligible_order_amount(
        order,
        include_shipping=settings_obj.include_shipping_in_points,
    )
    points = compute_points_for_amount(eligible, settings_obj.points_per_unit)
    if points <= 0:
        return None

    return apply_points_change(
        order.customer,
        points=points,
        transaction_type=LoyaltyPointTransactionType.ORDER_REWARD,
        reason=f"Cộng điểm từ đơn hàng {order.order_code}",
        order=order,
        created_by=actor,
    )


@transaction.atomic
def deduct_points_for_approved_return(order, *, actor=None):
    """Trừ điểm đã cộng khi duyệt trả toàn bộ đơn."""
    reward_tx = (
        LoyaltyPointTransaction.objects.filter(
            order=order,
            transaction_type=LoyaltyPointTransactionType.ORDER_REWARD,
        )
        .order_by("-id")
        .first()
    )
    if reward_tx is None:
        return None

    if LoyaltyPointTransaction.objects.filter(
        order=order,
        transaction_type=LoyaltyPointTransactionType.RETURN_DEDUCTION,
    ).exists():
        return None

    return apply_points_change(
        order.customer,
        points=reward_tx.points,
        transaction_type=LoyaltyPointTransactionType.RETURN_DEDUCTION,
        reason=f"Trừ điểm do hoàn trả đơn hàng {order.order_code}",
        order=order,
        created_by=actor,
    )


@transaction.atomic
def manual_adjust_points(customer, *, points, reason, actor, added=True):
    """Dealer/admin điều chỉnh điểm thủ công."""
    reason = (reason or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do điều chỉnh điểm."})
    if points <= 0:
        raise ValidationError({"points": "Số điểm phải lớn hơn 0."})

    tx_type = (
        LoyaltyPointTransactionType.MANUAL_ADD
        if added
        else LoyaltyPointTransactionType.MANUAL_DEDUCT
    )
    return apply_points_change(
        customer,
        points=points,
        transaction_type=tx_type,
        reason=reason,
        created_by=actor,
    )
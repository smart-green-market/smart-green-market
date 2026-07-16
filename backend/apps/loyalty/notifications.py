"""Thông báo liên quan điểm và hạng thành viên."""

from common.notifications import notify_account


def notify_loyalty_points_awarded(customer, order, points, actor):
    dealer_name = customer.user.store_dealer.store_name
    notify_account(
        account=customer.user,
        title="Bạn vừa nhận điểm tích lũy",
        content=(
            f"Bạn vừa nhận {points} điểm từ đơn hàng {order.order_code} "
            f"tại cửa hàng {dealer_name}."
        ),
        reference_type="loyalty_points",
        reference_id=customer.id,
        created_by=actor,
        notif_type="success",
    )


def notify_loyalty_points_deducted(customer, order, points, actor):
    dealer_name = customer.user.store_dealer.store_name
    notify_account(
        account=customer.user,
        title="Điểm tích lũy đã được điều chỉnh",
        content=(
            f"Hệ thống đã trừ {points} điểm do hoàn trả đơn hàng {order.order_code} "
            f"tại cửa hàng {dealer_name}."
        ),
        reference_type="loyalty_points",
        reference_id=customer.id,
        created_by=actor,
        notif_type="warning",
    )


def notify_loyalty_tier_changed(customer, *, old_tier, new_tier, reason, actor):
    dealer_name = customer.user.store_dealer.store_name
    if new_tier is None:
        return

    old_level = old_tier.level if old_tier else 0
    new_level = new_tier.level if new_tier else 0

    if new_level > old_level:
        title = "Chúc mừng! Bạn đã được nâng hạng"
        content = (
            f"Bạn đã được nâng lên hạng {new_tier.name} tại cửa hàng {dealer_name}."
        )
        notif_type = "success"
    elif new_level < old_level:
        title = "Hạng thành viên đã thay đổi"
        content = (
            f"Hạng của bạn tại {dealer_name} đã điều chỉnh thành {new_tier.name}."
        )
        if reason:
            content = f"{content} Lý do: {reason}"
        notif_type = "info"
    else:
        return

    notify_account(
        account=customer.user,
        title=title,
        content=content,
        reference_type="loyalty_tier",
        reference_id=customer.id,
        created_by=actor,
        notif_type=notif_type,
    )


def notify_loyalty_manual_adjustment(customer, points, reason, actor, *, added):
    dealer_name = customer.user.store_dealer.store_name
    sign = "+" if added else "-"
    notify_account(
        account=customer.user,
        title="Điểm tích lũy được điều chỉnh",
        content=(
            f"Cửa hàng {dealer_name} đã {sign}{points} điểm cho bạn. "
            f"Lý do: {reason}"
        ),
        reference_type="loyalty_points",
        reference_id=customer.id,
        created_by=actor,
        notif_type="info",
    )

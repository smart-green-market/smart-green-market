"""Nghiệp vụ đổi ngày giao cho đơn waiting_stock."""

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .delivery_slots import validate_delivery_datetime
from .models import OrderStatus
from .services import cancel_customer_order, record_status_change


@transaction.atomic
def dealer_propose_delivery_reschedule(
    order,
    user,
    *,
    proposed_delivery_time,
    reason="",
):
    """Dealer đề xuất ngày giao mới khi đơn đang chờ hàng về kho."""
    if order.status != OrderStatus.WAITING_STOCK:
        raise ValidationError(
            {"detail": "Chỉ đề xuất đổi ngày giao khi đơn đang chờ hàng về kho."}
        )

    reason = (reason or "").strip()
    if not reason:
        raise ValidationError({"reason": "Vui lòng nhập lý do đổi ngày giao."})

    validate_delivery_datetime(proposed_delivery_time)
    if proposed_delivery_time == order.delivery_time:
        raise ValidationError(
            {"proposed_delivery_time": "Ngày giao đề xuất phải khác ngày giao hiện tại."}
        )

    order.proposed_delivery_time = proposed_delivery_time
    order.reschedule_reason = reason
    order.save(
        update_fields=[
            "proposed_delivery_time",
            "reschedule_reason",
            "updated_at",
        ]
    )
    return record_status_change(
        order,
        OrderStatus.DELIVERY_RESCHEDULE_PROPOSED,
        user,
        note=f"Đề xuất đổi ngày giao: {reason}",
    )


@transaction.atomic
def customer_accept_delivery_reschedule(order, user):
    """Customer đồng ý ngày giao mới — giữ trạng thái chờ hàng."""
    if order.status != OrderStatus.DELIVERY_RESCHEDULE_PROPOSED:
        raise ValidationError({"detail": "Đơn không ở trạng thái chờ xác nhận đổi ngày giao."})
    if not order.proposed_delivery_time:
        raise ValidationError({"detail": "Không có ngày giao đề xuất."})

    order.delivery_time = order.proposed_delivery_time
    order.proposed_delivery_time = None
    order.reschedule_reason = ""
    order.save(
        update_fields=[
            "delivery_time",
            "proposed_delivery_time",
            "reschedule_reason",
            "updated_at",
        ]
    )
    return record_status_change(
        order,
        OrderStatus.WAITING_STOCK,
        user,
        note="Khách hàng đồng ý ngày giao mới",
    )


@transaction.atomic
def customer_reject_delivery_reschedule(order, user, *, reason=""):
    """Customer từ chối đề xuất → hủy đơn."""
    if order.status != OrderStatus.DELIVERY_RESCHEDULE_PROPOSED:
        raise ValidationError({"detail": "Đơn không ở trạng thái chờ xác nhận đổi ngày giao."})

    reject_reason = (reason or "Khách hàng từ chối đổi ngày giao.").strip()
    order.proposed_delivery_time = None
    order.reschedule_reason = ""
    order.save(
        update_fields=[
            "proposed_delivery_time",
            "reschedule_reason",
            "updated_at",
        ]
    )
    return cancel_customer_order(
        order,
        user,
        reason=reject_reason,
        actor="buyer",
    )

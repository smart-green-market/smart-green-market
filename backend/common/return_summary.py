"""Tóm tắt trả hàng cho list/detail API — dùng chung Order và Purchase Order."""

from decimal import Decimal

from rest_framework import serializers


def account_display_name(user):
    if user is None:
        return None
    full_name = getattr(user, "full_name", None)
    if full_name:
        return full_name
    return user.username


def build_return_summary(
    returns,
    *,
    order_status,
    return_requested_order_status,
    pending_return_status,
    approved_return_status,
    return_status_choices,
):
    pending = None
    approved_total = Decimal("0")
    latest = None

    for ret in returns:
        if latest is None or ret.created_at > latest.created_at:
            latest = ret
        if ret.status == pending_return_status:
            pending = ret
        if ret.status == approved_return_status:
            approved_total += ret.refund_amount or Decimal("0")

    latest_status = latest.status if latest else None
    status_labels = dict(return_status_choices)

    return {
        "has_pending_return": pending is not None,
        "pending_return_id": pending.id if pending else None,
        "approved_refund_total": approved_total.quantize(Decimal("0.01")),
        "latest_return_status": latest_status,
        "latest_return_status_label": (
            status_labels.get(latest_status, latest_status) if latest_status else None
        ),
        "can_review_return": (
            order_status == return_requested_order_status and pending is not None
        ),
    }


class ReturnSummarySerializer(serializers.Serializer):
    has_pending_return = serializers.BooleanField(
        help_text="Có yêu cầu trả hàng đang chờ duyệt",
    )
    pending_return_id = serializers.IntegerField(
        allow_null=True,
        help_text="ID yêu cầu trả đang chờ (dùng cho API review)",
    )
    approved_refund_total = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Tổng tiền đã duyệt trả (cộng các return approved)",
    )
    latest_return_status = serializers.CharField(
        allow_null=True,
        help_text="Trạng thái yêu cầu trả gần nhất",
    )
    latest_return_status_label = serializers.CharField(
        allow_null=True,
        help_text="Nhãn tiếng Việt của latest_return_status",
    )
    can_review_return = serializers.BooleanField(
        help_text="Đơn/phiếu ở return_requested và có yêu cầu chờ duyệt",
    )

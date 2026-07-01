"""Gửi thông báo khi trạng thái phiếu nhập thay đổi."""

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.purchase_orders.models import PurchaseOrderItemReviewStatus
from common.notification_messages import purchase_order_status_updated
from common.notifications import notify_account

Account = get_user_model()


def notify_purchase_order_status_change(order, *, actor, old_status=""):
    """Gửi notification cho bên còn lại (dealer ↔ supplier) khi status đổi.

    Gọi từ record_status_change — mỗi bước luồng đặt hàng đều trigger.
    FE: GET /api/notifications/my/ → reference_type=purchase_order → mở chi tiết đơn.
    """
    title, content, notif_type = purchase_order_status_updated(
        order,
        old_status=old_status,
    )
    targets = {order.dealer.account_id, order.supplier.account_id}
    actor_id = getattr(actor, "id", None)
    if actor_id:
        targets.discard(actor_id)

    for account_id in targets:
        notify_account(
            account=Account.objects.get(pk=account_id),
            title=title,
            content=content,
            reference_type="purchase_order",
            reference_id=order.id,
            created_by=actor,
            notif_type=notif_type,
        )


def notify_adjustment_pending_dealer(order, *, actor, delivery_changed, items_changed):
    """Thông báo dealer khi NCC đề xuất điều chỉnh — cần approve-adjustment hoặc cancel."""
    parts = []
    if delivery_changed and order.confirmed_delivery_time is not None:
        req_label = timezone.localtime(order.requested_delivery_time).strftime(
            "%d/%m/%Y %H:%M"
        )
        conf_label = timezone.localtime(order.confirmed_delivery_time).strftime(
            "%d/%m/%Y %H:%M"
        )
        parts.append(f"Ngày giao: dealer mong {req_label}, NCC cam kết {conf_label}.")

    if items_changed:
        rejected = [
            item.supplier_product.name
            for item in order.items.select_related("supplier_product").all()
            if item.review_status == PurchaseOrderItemReviewStatus.REJECTED
        ]
        adjusted = [
            (
                f"{item.supplier_product.name} "
                f"{item.original_quantity}→{item.quantity} {item.supplier_product.unit}"
            )
            for item in order.items.select_related("supplier_product").all()
            if item.review_status == PurchaseOrderItemReviewStatus.APPROVED
            and item.quantity != item.original_quantity
        ]
        if rejected:
            parts.append(f"Từ chối SP: {', '.join(rejected[:5])}.")
        if adjusted:
            parts.append(f"Điều chỉnh SL: {', '.join(adjusted[:5])}.")

    summary = " ".join(parts) if parts else "NCC đã đề xuất thay đổi điều kiện đơn hàng."
    content = (
        f"Phiếu {order.order_code}: {summary} "
        f"Tổng mới {order.total_amount:,.0f} VND (cọc {order.deposit_percent}%). "
        "Vui lòng xác nhận điều chỉnh hoặc hủy phiếu."
    )

    notify_account(
        account=order.dealer.account,
        title=f"[Phiếu nhập] {order.order_code} — Cần xác nhận điều chỉnh",
        content=content,
        reference_type="purchase_order",
        reference_id=order.id,
        created_by=actor,
        notif_type="warning",
    )

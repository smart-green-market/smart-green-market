"""Thông báo cho luồng YC đặt trước B2C."""

from django.contrib.auth import get_user_model

from common.notification_messages import preorder_request_event
from common.notifications import notify_account

Account = get_user_model()


def _notify_dealer(preorder, *, actor, event_key, extra=""):
    title, content, notif_type = preorder_request_event(preorder, event_key, extra=extra)
    notify_account(
        account=preorder.dealer.account,
        title=title,
        content=content,
        reference_type="customer_preorder_request",
        reference_id=preorder.id,
        created_by=actor,
        notif_type=notif_type,
    )


def _notify_customer(preorder, *, actor, event_key, extra=""):
    title, content, notif_type = preorder_request_event(preorder, event_key, extra=extra)
    notify_account(
        account=Account.objects.get(pk=preorder.customer.user_id),
        title=title,
        content=content,
        reference_type="customer_preorder_request",
        reference_id=preorder.id,
        created_by=actor,
        notif_type=notif_type,
    )


def notify_preorder_submitted(preorder, *, actor):
    _notify_dealer(preorder, actor=actor, event_key="submitted")


def notify_preorder_dealer_confirmed(preorder, *, actor):
    _notify_customer(preorder, actor=actor, event_key="dealer_confirmed")


def notify_preorder_dealer_proposed(preorder, *, actor):
    _notify_customer(preorder, actor=actor, event_key="dealer_proposed")


def notify_preorder_dealer_rejected(preorder, *, actor):
    _notify_customer(preorder, actor=actor, event_key="dealer_rejected")


def notify_preorder_customer_rejected(preorder, *, actor):
    _notify_dealer(preorder, actor=actor, event_key="customer_rejected")


def notify_preorder_converted_to_order(preorder, order, *, actor):
    from common.notification_messages import customer_order_status_updated
    from common.notifications import notify_account as notify

    title, content, notif_type = customer_order_status_updated(order, old_status="")
    notify(
        account=preorder.dealer.account,
        title=title,
        content=content,
        reference_type="customer_order",
        reference_id=order.id,
        created_by=actor,
        notif_type=notif_type,
    )

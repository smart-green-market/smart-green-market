"""Serialize notification receipts for REST API and WebSocket payloads."""

from common.notification_messages import notification_type_label, reference_type_label


def serialize_notification_receipt(receipt, purchase_orders_by_id=None, customer_orders_by_id=None):
    """Chuyển biên nhận thông báo sang dict cho API."""
    notification = receipt.notification
    data = {
        "receipt_id": receipt.id,
        "id": notification.id,
        "title": notification.title,
        "content": notification.content,
        "type": notification.type,
        "type_label": notification_type_label(notification.type),
        "reference_type": notification.reference_type,
        "reference_type_label": reference_type_label(notification.reference_type),
        "reference_id": notification.reference_id,
        "read_at": receipt.read_at,
        "created_at": notification.created_at,
        "reference_status": None,
        "reference_order_code": None,
    }
    if notification.reference_type == "purchase_order" and notification.reference_id:
        order = None
        if purchase_orders_by_id is not None:
            order = purchase_orders_by_id.get(notification.reference_id)
        if order is not None:
            data["reference_status"] = order.status
            data["reference_order_code"] = order.order_code
    if notification.reference_type == "customer_order" and notification.reference_id:
        order = None
        if customer_orders_by_id is not None:
            order = customer_orders_by_id.get(notification.reference_id)
        if order is not None:
            data["reference_status"] = order.status
            data["reference_order_code"] = order.order_code
    return data


def serialize_notification_receipts(receipts):
    """Chuyển danh sách biên nhận thông báo sang list dict."""
    po_ids = [
        r.notification.reference_id
        for r in receipts
        if r.notification.reference_type == "purchase_order" and r.notification.reference_id
    ]
    co_ids = [
        r.notification.reference_id
        for r in receipts
        if r.notification.reference_type == "customer_order" and r.notification.reference_id
    ]
    purchase_orders_by_id = {}
    if po_ids:
        from apps.purchase_orders.models import PurchaseOrder

        purchase_orders_by_id = {
            o.id: o
            for o in PurchaseOrder.objects.filter(id__in=po_ids).only(
                "id", "status", "order_code"
            )
        }
    customer_orders_by_id = {}
    if co_ids:
        from apps.orders.models import Order

        customer_orders_by_id = {
            o.id: o
            for o in Order.objects.filter(id__in=co_ids).only(
                "id", "status", "order_code"
            )
        }
    return [
        serialize_notification_receipt(
            r,
            purchase_orders_by_id,
            customer_orders_by_id,
        )
        for r in receipts
    ]


def serialize_notification_receipt_for_push(receipt):
    """Serialize một receipt kèm enrich order khi push realtime."""
    notification = receipt.notification
    purchase_orders_by_id = None
    customer_orders_by_id = None

    if notification.reference_type == "purchase_order" and notification.reference_id:
        from apps.purchase_orders.models import PurchaseOrder

        order = PurchaseOrder.objects.filter(pk=notification.reference_id).only(
            "id", "status", "order_code"
        ).first()
        if order:
            purchase_orders_by_id = {order.id: order}

    if notification.reference_type == "customer_order" and notification.reference_id:
        from apps.orders.models import Order

        order = Order.objects.filter(pk=notification.reference_id).only(
            "id", "status", "order_code"
        ).first()
        if order:
            customer_orders_by_id = {order.id: order}

    return serialize_notification_receipt(
        receipt,
        purchase_orders_by_id,
        customer_orders_by_id,
    )

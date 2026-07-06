"""Trạng thái trả hàng theo dòng phiếu nhập — derive từ PurchaseOrderReturnItem."""

from __future__ import annotations

from decimal import Decimal

from .models import PurchaseOrderItemReviewStatus, PurchaseOrderReturnStatus

RETURN_STATUS_NONE = "none"
RETURN_STATUS_REQUESTED = "return_requested"
RETURN_STATUS_PARTIAL = "partially_returned"
RETURN_STATUS_FULL = "fully_returned"

RETURN_STATUS_LABELS = {
    RETURN_STATUS_NONE: None,
    RETURN_STATUS_REQUESTED: "Chờ duyệt trả hàng",
    RETURN_STATUS_PARTIAL: "Trả một phần",
    RETURN_STATUS_FULL: "Đã trả hết",
}


def _quantize_qty(value) -> Decimal:
    return Decimal(value or 0)


def build_purchase_order_item_return_info(item) -> dict:
    """
    Tính trạng thái trả hàng hiển thị cho một dòng PO.
    Không đổi review_status — chỉ dùng cho API/UI.
    """
    line_qty = _quantize_qty(item.quantity)

    if item.review_status != PurchaseOrderItemReviewStatus.APPROVED or line_qty <= 0:
        return {
            "return_status": RETURN_STATUS_NONE,
            "return_status_label": None,
            "pending_return_quantity": Decimal("0"),
            "returned_quantity": Decimal("0"),
            "returnable_quantity": Decimal("0"),
        }

    pending_qty = Decimal("0")
    approved_qty = Decimal("0")

    return_items = getattr(item, "return_items", None)
    if return_items is not None:
        iterable = return_items.all() if hasattr(return_items, "all") else return_items
    else:
        iterable = item.return_items.select_related("purchase_order_return").all()

    for row in iterable:
        ret = row.purchase_order_return
        qty = _quantize_qty(row.quantity)
        if ret.status == PurchaseOrderReturnStatus.REQUESTED:
            pending_qty += qty
        elif ret.status == PurchaseOrderReturnStatus.APPROVED:
            approved_qty += qty

    if pending_qty > 0:
        status = RETURN_STATUS_REQUESTED
    elif approved_qty >= line_qty:
        status = RETURN_STATUS_FULL
    elif approved_qty > 0:
        status = RETURN_STATUS_PARTIAL
    else:
        status = RETURN_STATUS_NONE

    returnable_qty = max(line_qty - approved_qty, Decimal("0"))

    return {
        "return_status": status,
        "return_status_label": RETURN_STATUS_LABELS[status],
        "pending_return_quantity": pending_qty,
        "returned_quantity": approved_qty,
        "returnable_quantity": returnable_qty,
    }

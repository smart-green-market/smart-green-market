"""Tổng hợp nhu cầu đặt hàng theo sản phẩm NCC (phiếu nhập đại lý)."""

from decimal import Decimal

from django.db.models import DecimalField, Q, Sum
from django.db.models.functions import Coalesce

from apps.purchase_orders.models import PurchaseOrderItem, PurchaseOrderStatus

# Phiếu chờ NCC xác nhận
PENDING_APPROVAL_STATUSES = (
    PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
)

# Phiếu đã xác nhận — NCC cần chuẩn bị / thu hoạch / giao (chưa delivered)
PREPARATION_STATUSES = (
    PurchaseOrderStatus.CONFIRMED,
    PurchaseOrderStatus.DEPOSIT_PENDING_VERIFICATION,
    PurchaseOrderStatus.DEPOSIT_PAID,
    PurchaseOrderStatus.PROCESSING,
    PurchaseOrderStatus.SHIPPING,
)

PO_TERMINAL_STATUSES = {
    PurchaseOrderStatus.REJECTED,
    PurchaseOrderStatus.COMPLETED,
    PurchaseOrderStatus.CANCELLED,
}


def annotate_supplier_product_order_demand(qs):
    """Gắn pending_order_quantity và preparation_quantity lên queryset."""
    return qs.annotate(
        pending_order_quantity=Coalesce(
            Sum(
                "purchase_order_items__quantity",
                filter=Q(
                    purchase_order_items__purchase_order__status__in=PENDING_APPROVAL_STATUSES,
                ),
            ),
            Decimal("0"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        ),
        preparation_quantity=Coalesce(
            Sum(
                "purchase_order_items__quantity",
                filter=Q(
                    purchase_order_items__purchase_order__status__in=PREPARATION_STATUSES,
                ),
            ),
            Decimal("0"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        ),
    )


def purchase_order_items_for_product(product):
    """Các dòng phiếu nhập còn hiệu lực của một sản phẩm NCC."""
    return (
        PurchaseOrderItem.objects.filter(supplier_product=product)
        .exclude(purchase_order__status__in=PO_TERMINAL_STATUSES)
        .select_related("purchase_order", "purchase_order__dealer")
        .order_by("-purchase_order__created_at", "-id")
    )

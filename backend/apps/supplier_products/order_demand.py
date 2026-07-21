"""Tổng hợp nhu cầu đặt hàng theo sản phẩm NCC (phiếu nhập đại lý)."""

from decimal import Decimal

from django.db.models import Count, DecimalField, Q, Sum
from django.db.models.functions import Coalesce

from apps.accounts.models import AccountRole
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus

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


def annotate_pending_purchase_order_count(qs):
    """Số phiếu distinct chờ NCC xác nhận trên từng sản phẩm."""
    return qs.annotate(
        pending_purchase_order_count=Count(
            "purchase_order_items__purchase_order",
            filter=Q(
                purchase_order_items__purchase_order__status__in=PENDING_APPROVAL_STATUSES,
            ),
            distinct=True,
        ),
    )


def queryset_supplier_products_pending_confirmation(qs):
    """Sản phẩm có tổng SL đặt trên phiếu pending_supplier_confirmation > 0."""
    qs = annotate_supplier_product_order_demand(qs)
    qs = annotate_pending_purchase_order_count(qs)
    return qs.filter(pending_order_quantity__gt=0).order_by(
        "-pending_order_quantity",
        "-updated_at",
        "-id",
    )


def resolve_supplier_id_for_pending_confirmation(user, supplier_id_param):
    """
    Supplier: luôn scope theo NCC của mình.
    Admin: optional ?supplier_id=; None = tất cả NCC.
    """
    if user.role == AccountRole.SUPPLIER:
        profile = getattr(user, "supplier_profile", None)
        return profile.id if profile else None
    if user.role == AccountRole.ADMIN and supplier_id_param not in (None, ""):
        try:
            return int(supplier_id_param)
        except (TypeError, ValueError) as exc:
            raise ValueError("supplier_id phải là số nguyên.") from exc
    return None


def pending_confirmation_summary(*, supplier_id=None):
    """Thống kê phiếu / SL chờ NCC xác nhận (một NCC hoặc toàn hệ thống)."""
    po_qs = PurchaseOrder.objects.filter(
        status=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
    )
    item_qs = PurchaseOrderItem.objects.filter(
        purchase_order__status=PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
    )
    if supplier_id is not None:
        po_qs = po_qs.filter(supplier_id=supplier_id)
        item_qs = item_qs.filter(purchase_order__supplier_id=supplier_id)

    total_qty = item_qs.aggregate(
        total=Coalesce(
            Sum("quantity"),
            Decimal("0"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        ),
    )["total"]

    return {
        "pending_purchase_order_count": po_qs.count(),
        "pending_line_quantity_total": total_qty,
    }

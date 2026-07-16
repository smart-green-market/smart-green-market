"""Danh sách đại lý đã đặt hàng từ nhà cung cấp."""

from django.db.models import Count, DecimalField, Max, Q, Sum
from django.db.models.functions import Coalesce

from apps.dealers.models import DealerProfile
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderStatus

SUPPLIER_DEALER_EXCLUDED_ORDER_STATUSES = (
    PurchaseOrderStatus.CANCELLED,
    PurchaseOrderStatus.REJECTED,
)


def get_supplier_purchasing_dealers_qs(supplier, *, search=None, ordering="-last_order_at"):
    """Đại lý có ít nhất một phiếu nhập (không tính hủy / NCC từ chối)."""
    active_po_filter = Q(purchase_orders__supplier=supplier) & ~Q(
        purchase_orders__status__in=SUPPLIER_DEALER_EXCLUDED_ORDER_STATUSES,
    )
    completed_po_filter = Q(
        purchase_orders__supplier=supplier,
        purchase_orders__status=PurchaseOrderStatus.COMPLETED,
    )

    dealer_ids = (
        PurchaseOrder.objects.filter(supplier=supplier)
        .exclude(status__in=SUPPLIER_DEALER_EXCLUDED_ORDER_STATUSES)
        .values_list("dealer_id", flat=True)
        .distinct()
    )

    qs = (
        DealerProfile.objects.filter(id__in=dealer_ids)
        .select_related("account")
        .annotate(
            order_count=Count("purchase_orders", filter=active_po_filter, distinct=True),
            completed_order_count=Count(
                "purchase_orders",
                filter=completed_po_filter,
                distinct=True,
            ),
            last_order_at=Max(
                "purchase_orders__created_at",
                filter=active_po_filter,
            ),
            total_purchase_amount=Coalesce(
                Sum(
                    "purchase_orders__total_amount",
                    filter=completed_po_filter,
                ),
                0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            ),
        )
    )

    if search:
        search = search.strip()
        if search:
            qs = qs.filter(
                Q(store_name__icontains=search)
                | Q(store_address__icontains=search)
                | Q(account__full_name__icontains=search)
                | Q(account__phone__icontains=search)
                | Q(account__email__icontains=search)
            )

    allowed_orderings = {
        "store_name": "store_name",
        "-store_name": "-store_name",
        "last_order_at": "last_order_at",
        "-last_order_at": "-last_order_at",
        "order_count": "order_count",
        "-order_count": "-order_count",
        "total_purchase_amount": "total_purchase_amount",
        "-total_purchase_amount": "-total_purchase_amount",
    }
    order_field = allowed_orderings.get(ordering, "-last_order_at")
    return qs.order_by(order_field, "-id")

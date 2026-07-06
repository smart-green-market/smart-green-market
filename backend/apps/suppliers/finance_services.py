"""Tổng hợp số liệu tài chính nhà cung cấp cho admin."""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from apps.purchase_orders.models import (
    PurchaseOrder,
    PurchaseOrderPayment,
    PurchaseOrderPaymentStatus,
    PurchaseOrderReturn,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
)

from .models import Supplier

REVENUE_ORDER_STATUSES = (
    PurchaseOrderStatus.COMPLETED,
    PurchaseOrderStatus.DELIVERED,
)
CASH_FLOW_MONTHS = 6


def filter_suppliers_for_finance(
    *,
    search: str | None = None,
    verification_status: str | None = None,
):
    """Lọc NCC theo từ khóa và trạng thái duyệt."""
    qs = Supplier.objects.all().order_by("-updated_at", "-id")
    if verification_status:
        qs = qs.filter(verification_status=verification_status)
    if search:
        term = search.strip()
        if term:
            qs = qs.filter(
                Q(company_name__icontains=term) | Q(tax_code__icontains=term)
            )
    return qs


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"))


def _build_metrics_lookup(supplier_ids: list[int]) -> dict[int, dict]:
    """Tính chỉ số tài chính theo batch cho danh sách supplier."""
    if not supplier_ids:
        return {}

    revenue_rows = (
        PurchaseOrder.objects.filter(
            supplier_id__in=supplier_ids,
            status__in=REVENUE_ORDER_STATUSES,
        )
        .values("supplier_id")
        .annotate(
            total_revenue=Coalesce(Sum("total_amount"), Decimal("0")),
            order_count=Count("id"),
        )
    )
    revenue_by_supplier = {
        row["supplier_id"]: row for row in revenue_rows
    }

    cash_in_rows = (
        PurchaseOrderPayment.objects.filter(
            status=PurchaseOrderPaymentStatus.VERIFIED,
            purchase_order__supplier_id__in=supplier_ids,
        )
        .values("purchase_order__supplier_id")
        .annotate(cash_in=Coalesce(Sum("amount"), Decimal("0")))
    )
    cash_in_by_supplier = {
        row["purchase_order__supplier_id"]: row["cash_in"]
        for row in cash_in_rows
    }

    cash_out_rows = (
        PurchaseOrderReturn.objects.filter(
            status=PurchaseOrderReturnStatus.APPROVED,
            purchase_order__supplier_id__in=supplier_ids,
        )
        .values("purchase_order__supplier_id")
        .annotate(cash_out=Coalesce(Sum("refund_amount"), Decimal("0")))
    )
    cash_out_by_supplier = {
        row["purchase_order__supplier_id"]: row["cash_out"]
        for row in cash_out_rows
    }

    metrics: dict[int, dict] = {}
    for supplier_id in supplier_ids:
        revenue_row = revenue_by_supplier.get(supplier_id, {})
        total_revenue = _quantize_money(
            Decimal(revenue_row.get("total_revenue") or 0)
        )
        metrics[supplier_id] = {
            "total_revenue": total_revenue,
            "cash_in": _quantize_money(
                Decimal(cash_in_by_supplier.get(supplier_id) or 0)
            ),
            "cash_out": _quantize_money(
                Decimal(cash_out_by_supplier.get(supplier_id) or 0)
            ),
            "order_count": int(revenue_row.get("order_count") or 0),
        }
    return metrics


def _month_keys(months: int = CASH_FLOW_MONTHS) -> list[str]:
    now = timezone.now()
    keys: list[str] = []
    year = now.year
    month = now.month
    for _ in range(months):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(keys))


def build_cash_flow_trend(supplier_id: int, months: int = CASH_FLOW_MONTHS) -> list[dict]:
    """Dòng tiền theo tháng: tiền vào (thanh toán đã xác minh) / tiền ra (hoàn trả)."""
    month_keys = _month_keys(months)
    if not month_keys:
        return []

    start_month = month_keys[0]
    start_year, start_mon = (int(part) for part in start_month.split("-"))
    period_start = timezone.datetime(
        start_year,
        start_mon,
        1,
        tzinfo=timezone.get_current_timezone(),
    )

    inflow_rows = (
        PurchaseOrderPayment.objects.filter(
            status=PurchaseOrderPaymentStatus.VERIFIED,
            purchase_order__supplier_id=supplier_id,
        )
        .filter(
            Q(verified_at__gte=period_start)
            | Q(verified_at__isnull=True, paid_at__gte=period_start)
            | Q(
                verified_at__isnull=True,
                paid_at__isnull=True,
                created_at__gte=period_start,
            )
        )
        .annotate(
            month=TruncMonth(
                Coalesce("verified_at", "paid_at", "created_at"),
            )
        )
        .values("month")
        .annotate(total_in=Coalesce(Sum("amount"), Decimal("0")))
    )
    inflow_map = {
        row["month"].strftime("%Y-%m"): _quantize_money(Decimal(row["total_in"] or 0))
        for row in inflow_rows
        if row["month"] is not None
    }

    outflow_rows = (
        PurchaseOrderReturn.objects.filter(
            status=PurchaseOrderReturnStatus.APPROVED,
            purchase_order__supplier_id=supplier_id,
        )
        .filter(
            Q(resolved_at__gte=period_start)
            | Q(resolved_at__isnull=True, created_at__gte=period_start)
        )
        .annotate(
            month=TruncMonth(Coalesce("resolved_at", "created_at")),
        )
        .values("month")
        .annotate(total_out=Coalesce(Sum("refund_amount"), Decimal("0")))
    )
    outflow_map = {
        row["month"].strftime("%Y-%m"): _quantize_money(Decimal(row["total_out"] or 0))
        for row in outflow_rows
        if row["month"] is not None
    }

    return [
        {
            "month": key,
            "in": float(inflow_map.get(key, Decimal("0"))),
            "out": float(outflow_map.get(key, Decimal("0"))),
        }
        for key in month_keys
    ]


def serialize_supplier_finance(supplier: Supplier, metrics: dict) -> dict:
    """Chuẩn hóa payload tài chính một NCC."""
    return {
        "id": supplier.id,
        "company_name": supplier.company_name,
        "tax_code": supplier.tax_code,
        "phone": supplier.phone,
        "address": supplier.address,
        "verification_status": supplier.verification_status,
        "total_revenue": metrics["total_revenue"],
        "cash_in": metrics["cash_in"],
        "cash_out": metrics["cash_out"],
        "order_count": metrics["order_count"],
        "cash_flow": build_cash_flow_trend(supplier.id),
        "updated_at": supplier.updated_at,
    }


def build_finance_overview(*, search: str | None = None, verification_status: str | None = None) -> dict:
    """Tổng quan tài chính toàn hệ thống (theo bộ lọc)."""
    suppliers = list(
        filter_suppliers_for_finance(
            search=search,
            verification_status=verification_status,
        ).only("id")
    )
    supplier_ids = [supplier.id for supplier in suppliers]
    metrics_lookup = _build_metrics_lookup(supplier_ids)

    totals = {
        "total_revenue": Decimal("0"),
        "cash_in": Decimal("0"),
        "cash_out": Decimal("0"),
    }
    for supplier_id in supplier_ids:
        row = metrics_lookup.get(supplier_id) or {}
        totals["total_revenue"] += Decimal(row.get("total_revenue") or 0)
        totals["cash_in"] += Decimal(row.get("cash_in") or 0)
        totals["cash_out"] += Decimal(row.get("cash_out") or 0)

    return {
        "total_system_revenue": _quantize_money(totals["total_revenue"]),
        "total_cash_in": _quantize_money(totals["cash_in"]),
        "total_cash_out": _quantize_money(totals["cash_out"]),
        "supplier_count": len(supplier_ids),
    }


def build_finance_list_queryset(*, search: str | None = None, verification_status: str | None = None):
    """Queryset NCC đã lọc, sắp xếp theo doanh thu giảm dần."""
    return (
        filter_suppliers_for_finance(
            search=search,
            verification_status=verification_status,
        )
        .annotate(
            total_revenue=Coalesce(
                Sum(
                    "purchase_orders__total_amount",
                    filter=Q(purchase_orders__status__in=REVENUE_ORDER_STATUSES),
                ),
                Decimal("0"),
            ),
        )
        .order_by("-total_revenue", "-id")
    )

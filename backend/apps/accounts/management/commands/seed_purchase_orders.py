"""Seed phiếu nhập (PO) + thanh toán xác minh — dòng tiền NCC & chi phí nhập đại lý."""

from __future__ import annotations

from decimal import Decimal

from datetime import timedelta

from django.utils import timezone

from apps.dealers.models import DealerProfile
from apps.purchase_orders.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderItemReviewStatus,
    PurchaseOrderPayment,
    PurchaseOrderPaymentMethod,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
    PurchaseOrderReturn,
    PurchaseOrderReturnStatus,
    PurchaseOrderStatus,
)
from apps.supplier_products.models import SupplierProduct
from apps.suppliers.models import Supplier

from .seed_product_helpers import int_money


def _po_total_amount(supplier_index: int, dealer_index: int, seq: int) -> Decimal:
    base = 4_000_000 + supplier_index * 850_000 + dealer_index * 520_000 + seq * 125_000
    return int_money(base)


def seed_purchase_orders_and_payments(
    *,
    dealers: list[DealerProfile],
    suppliers: list[Supplier],
    supplier_products: list[SupplierProduct],
) -> dict[str, int]:
    """Tạo PO hoàn tất + thanh toán verified (tiền vào NCC) và một số hoàn trả (tiền ra)."""
    stats = {"purchase_orders": 0, "payments": 0, "returns": 0}
    if not dealers or not suppliers or not supplier_products:
        return stats

    products_by_supplier: dict[int, list[SupplierProduct]] = {}
    for sp in supplier_products:
        products_by_supplier.setdefault(sp.supplier_id, []).append(sp)

    po_seq = 0
    first_po_for_return: PurchaseOrder | None = None

    for s_idx, supplier in enumerate(suppliers):
        prods = products_by_supplier.get(supplier.id) or []
        if not prods:
            continue
        sp = prods[s_idx % len(prods)]

        for d_idx, dealer in enumerate(dealers):
            po_seq += 1
            total = _po_total_amount(s_idx, d_idx, po_seq)
            deposit_percent = Decimal("30.00")
            deposit_amount = int_money(int(total) * 30 // 100)
            final_amount = int_money(int(total) - int(deposit_amount))
            paid_amount = total

            event_at = timezone.now() - timedelta(days=12 + po_seq * 9)
            order_code = f"PN-D{d_idx + 1:02d}S{s_idx + 1:02d}N{po_seq:03d}"

            po = PurchaseOrder.objects.create(
                order_code=order_code,
                supplier=supplier,
                dealer=dealer,
                status=PurchaseOrderStatus.COMPLETED,
                delivery_address=dealer.store_address,
                requested_delivery_time=event_at,
                confirmed_delivery_time=event_at,
                receiver_name=dealer.account.full_name[:255],
                receiver_phone=dealer.account.phone[:20],
                note="Don nhap seed",
                total_amount=total,
                deposit_percent=deposit_percent,
                deposit_amount=deposit_amount,
                paid_amount=paid_amount,
                debt_amount=int_money(0),
                credit_amount=int_money(0),
                confirmed_at=event_at,
                delivered_at=event_at,
                completed_at=event_at,
            )
            PurchaseOrder.objects.filter(pk=po.pk).update(
                created_at=event_at,
                updated_at=event_at,
            )
            stats["purchase_orders"] += 1
            if first_po_for_return is None:
                first_po_for_return = po

            qty = Decimal("200")
            unit_price = int_money(sp.wholesale_price)
            line_subtotal = int_money(int(unit_price) * int(qty))
            if int(line_subtotal) != int(total):
                qty = Decimal(max(1, int(total) // max(int(unit_price), 1)))
                line_subtotal = int_money(int(unit_price) * int(qty))
                if int(line_subtotal) < int(total):
                    line_subtotal = total

            PurchaseOrderItem.objects.create(
                purchase_order=po,
                supplier_product=sp,
                quantity=qty,
                original_quantity=qty,
                unit_price=unit_price,
                base_unit_price=unit_price,
                line_discount_amount=int_money(0),
                subtotal=line_subtotal,
                review_status=PurchaseOrderItemReviewStatus.APPROVED,
            )
            if int(line_subtotal) != int(total):
                PurchaseOrder.objects.filter(pk=po.pk).update(total_amount=line_subtotal)
                total = line_subtotal
                deposit_amount = int_money(int(total) * 30 // 100)
                final_amount = int_money(int(total) - int(deposit_amount))
                paid_amount = total

            pay_common = {
                "purchase_order": po,
                "payment_method": PurchaseOrderPaymentMethod.BANK_TRANSFER,
                "status": PurchaseOrderPaymentStatus.VERIFIED,
                "verified_at": event_at,
                "paid_at": event_at,
            }
            PurchaseOrderPayment.objects.create(
                **pay_common,
                amount=deposit_amount,
                payment_type=PurchaseOrderPaymentType.DEPOSIT,
            )
            PurchaseOrderPayment.objects.create(
                **pay_common,
                amount=final_amount,
                payment_type=PurchaseOrderPaymentType.FINAL_PAYMENT,
            )
            stats["payments"] += 2

    if first_po_for_return is not None:
        refund = int_money(int(first_po_for_return.total_amount) * 5 // 100)
        if int(refund) > 0:
            resolved = timezone.now() - timedelta(days=5)
            PurchaseOrderReturn.objects.create(
                purchase_order=first_po_for_return,
                status=PurchaseOrderReturnStatus.APPROVED,
                reason="Hang loi seed (mau hoan tra)",
                refund_amount=refund,
                resolved_at=resolved,
            )
            stats["returns"] += 1

    return stats

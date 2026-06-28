"""Soft-delete sản phẩm NCC."""

from django.db import transaction

from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.purchase_orders.models import PurchaseOrderItem, PurchaseOrderStatus
from common.soft_delete import soft_delete_blocked

from .models import SupplierProduct, SupplierProductStatus

PO_TERMINAL_STATUSES = {
    PurchaseOrderStatus.REJECTED,
    PurchaseOrderStatus.COMPLETED,
    PurchaseOrderStatus.CANCELLED,
}


def _active_purchase_order_count(product) -> int:
    return PurchaseOrderItem.objects.filter(
        supplier_product=product,
    ).exclude(
        purchase_order__status__in=PO_TERMINAL_STATUSES,
    ).count()


def _active_dealer_product_count(product) -> int:
    return DealerProduct.objects.filter(
        supplier_product=product,
    ).exclude(status=DealerProductStatus.DELETED).count()


@transaction.atomic
def soft_delete_supplier_product(product: SupplierProduct, user):
    """Ẩn sản phẩm NCC (status=deleted) sau khi kiểm tra ràng buộc nghiệp vụ."""
    if product.status == SupplierProductStatus.DELETED:
        return product

    po_count = _active_purchase_order_count(product)
    if po_count:
        soft_delete_blocked(
            code="has_active_purchase_orders",
            detail=(
                "Không thể xóa sản phẩm vì còn phiếu nhập đang xử lý. "
                "Chờ phiếu hoàn tất, bị từ chối hoặc hủy trước khi xóa."
            ),
            active_purchase_orders=po_count,
        )

    dealer_count = _active_dealer_product_count(product)
    if dealer_count:
        soft_delete_blocked(
            code="has_dealer_products",
            detail=(
                "Không thể xóa sản phẩm vì đại lý vẫn đang bán sản phẩm này. "
                "Yêu cầu đại lý gỡ sản phẩm bán lẻ trước."
            ),
            dealer_products=dealer_count,
        )

    product.status = SupplierProductStatus.DELETED
    product.save(update_fields=["status", "updated_at"])
    return product

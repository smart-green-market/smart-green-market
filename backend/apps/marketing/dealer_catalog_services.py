"""Ghi nhận tương tác đại lý với catalog sản phẩm NCC (B2B)."""

from rest_framework.exceptions import ValidationError

from apps.accounts.models import AccountStatus
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import SupplierVerificationStatus

from .interaction_core import InteractionTrackResult, apply_purchase_increment, apply_track_action
from .models import DealerSupplierProductInteraction

DEALER_CATALOG_TRACK_ACTIONS = frozenset({"view", "add_cart"})


def _get_or_create_interaction(*, dealer, supplier, supplier_product) -> DealerSupplierProductInteraction:
    interaction, _ = DealerSupplierProductInteraction.objects.get_or_create(
        dealer=dealer,
        supplier_product=supplier_product,
        defaults={"supplier": supplier},
    )
    if interaction.supplier_id != supplier.id:
        interaction.supplier = supplier
        interaction.save(update_fields=["supplier", "updated_at"])
    return interaction


def resolve_dealer_catalog_supplier_product(*, supplier, supplier_product_id: int):
    try:
        product = SupplierProduct.objects.select_related("supplier").get(pk=supplier_product_id)
    except SupplierProduct.DoesNotExist as exc:
        raise ValidationError({"supplier_product_id": "Sản phẩm không tồn tại."}) from exc
    if product.supplier_id != supplier.id:
        raise ValidationError({"supplier_product_id": "Sản phẩm không thuộc nhà cung cấp này."})
    if product.status != SupplierProductStatus.ACTIVE:
        raise ValidationError({"supplier_product_id": "Sản phẩm không còn bán."})
    if product.wholesale_price is None:
        raise ValidationError({"supplier_product_id": "Sản phẩm chưa có giá sỉ."})
    if supplier.verification_status != SupplierVerificationStatus.APPROVED:
        raise ValidationError({"detail": "Nhà cung cấp chưa được duyệt."})
    if supplier.account.status != AccountStatus.ACTIVE:
        raise ValidationError({"detail": "Tài khoản nhà cung cấp chưa active."})
    return product


def track_dealer_catalog_interaction(
    *,
    dealer,
    supplier,
    supplier_product_id: int,
    action: str,
) -> InteractionTrackResult:
    """Ghi nhận view hoặc add_cart khi đại lý duyệt catalog NCC."""
    product = resolve_dealer_catalog_supplier_product(
        supplier=supplier,
        supplier_product_id=supplier_product_id,
    )
    interaction = _get_or_create_interaction(
        dealer=dealer,
        supplier=supplier,
        supplier_product=product,
    )
    return apply_track_action(interaction, action)


def track_purchase_interactions_for_purchase_orders(*, dealer, items_data) -> None:
    """Cộng purchase_count khi đại lý gửi phiếu nhập thành công."""
    seen_product_ids: set[int] = set()

    for row in items_data:
        product = row["supplier_product"]
        if product.id in seen_product_ids:
            continue
        seen_product_ids.add(product.id)

        interaction = _get_or_create_interaction(
            dealer=dealer,
            supplier=product.supplier,
            supplier_product=product,
        )
        apply_purchase_increment(interaction)

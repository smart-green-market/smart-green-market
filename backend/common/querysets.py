"""Helper lọc và sắp xếp queryset theo vai trò người dùng."""

from django.db.models import Case, IntegerField, Q, Value, When

from apps.accounts.models import AccountRole
from apps.categories.models import CategoryScope, CategoryStatus

PENDING_STATUS = "pending"

# Thứ tự phụ sau khi ưu tiên pending
ORDER_CATEGORY = ("sort_order", "name")
ORDER_NEWEST = ("-created_at", "-id")
ORDER_UPDATED = ("-updated_at", "-created_at", "-id")
ORDER_DOCUMENT = ("document_type", "-created_at")
ORDER_IMAGE = ("sort_order", "id")
ORDER_CULTIVATION = ("step_order", "id")


def is_admin(user):
    """Kiểm tra user có role admin hay không."""
    return user.role == AccountRole.ADMIN


def is_supplier_or_dealer(user):
    """Kiểm tra user có role supplier hoặc dealer."""
    return user.role in (AccountRole.SUPPLIER, AccountRole.DEALER)


def order_pending_first(queryset, status_field, ordering, pending_values=PENDING_STATUS):
    """Đưa bản ghi chờ duyệt lên đầu, sau đó sort theo ordering."""
    if isinstance(pending_values, str):
        pending_values = (pending_values,)
    priority = Case(
        When(**{f"{status_field}__in": pending_values}, then=Value(0)),
        default=Value(1),
        output_field=IntegerField(),
    )
    return queryset.annotate(_pending_priority=priority).order_by(
        "_pending_priority",
        *ordering,
    )


def _apply_order(queryset, ordering, pending_field=None, pending_values=PENDING_STATUS):
    """Áp dụng ordering; ưu tiên bản ghi pending nếu có pending_field."""
    if pending_field:
        return order_pending_first(queryset, pending_field, ordering, pending_values)
    return queryset.order_by(*ordering)


def filter_admin_or_created_by(
    qs,
    user,
    ordering=ORDER_NEWEST,
    pending_field=None,
    pending_values=PENDING_STATUS,
):
    """Admin: tất cả. Supplier/Dealer: chỉ bản ghi do mình tạo."""
    if is_admin(user):
        filtered = qs
    elif is_supplier_or_dealer(user):
        filtered = qs.filter(created_by=user)
    else:
        return qs.none()
    return _apply_order(filtered, ordering, pending_field, pending_values)


def filter_categories_for_user(
    qs,
    user,
    ordering=ORDER_CATEGORY,
    pending_field=None,
    pending_values=PENDING_STATUS,
):
    """Admin: tất cả. Supplier/Dealer: danh mục hệ thống active + danh mục riêng của mình."""
    if is_admin(user):
        filtered = qs
    elif is_supplier_or_dealer(user):
        filtered = qs.filter(
            Q(scope=CategoryScope.SYSTEM, status=CategoryStatus.ACTIVE)
            | Q(scope=CategoryScope.CUSTOM, created_by=user)
        )
    elif user.role == AccountRole.BUYER:
        filtered = qs.filter(
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
    else:
        return qs.none()
    return _apply_order(filtered, ordering, pending_field, pending_values)


def filter_admin_or_dealer_account(
    qs,
    user,
    account_lookup="account",
    ordering=ORDER_NEWEST,
    pending_field=None,
    pending_values=PENDING_STATUS,
):
    """Admin: tất cả. Dealer: chỉ dữ liệu thuộc tài khoản đại lý."""
    if is_admin(user):
        filtered = qs
    elif user.role == AccountRole.DEALER:
        filtered = qs.filter(**{account_lookup: user})
    else:
        return qs.none()
    return _apply_order(filtered, ordering, pending_field, pending_values)


def filter_admin_or_supplier_account(
    qs,
    user,
    account_lookup="supplier__account",
    ordering=ORDER_NEWEST,
    pending_field=None,
    pending_values=PENDING_STATUS,
):
    """Admin: tất cả. Supplier: chỉ dữ liệu thuộc tài khoản NCC của mình."""
    if is_admin(user):
        filtered = qs
    elif user.role == AccountRole.SUPPLIER:
        filtered = qs.filter(**{account_lookup: user})
    else:
        return qs.none()
    return _apply_order(filtered, ordering, pending_field, pending_values)


def filter_suppliers_for_dealer(qs, ordering=ORDER_NEWEST):
    """Đại lý: chỉ NCC đã duyệt và tài khoản active (catalog đặt hàng)."""
    from apps.accounts.models import AccountStatus
    from apps.suppliers.models import SupplierVerificationStatus

    return qs.filter(
        verification_status=SupplierVerificationStatus.APPROVED,
        account__status=AccountStatus.ACTIVE,
    ).order_by(*ordering)


def filter_supplier_products_for_dealer(qs, *, supplier_id=None, ordering=ORDER_UPDATED):
    """Đại lý: sản phẩm active của NCC đã duyệt, có giá sỉ."""
    from apps.accounts.models import AccountStatus
    from apps.supplier_products.models import SupplierProductStatus
    from apps.suppliers.models import SupplierVerificationStatus

    filtered = qs.filter(
        status=SupplierProductStatus.ACTIVE,
        supplier__verification_status=SupplierVerificationStatus.APPROVED,
        supplier__account__status=AccountStatus.ACTIVE,
        wholesale_price__isnull=False,
    )
    if supplier_id:
        filtered = filtered.filter(supplier_id=supplier_id)
    return filtered.order_by(*ordering)


PO_PENDING_STATUSES = (
    "pending_supplier_confirmation",
    "deposit_pending_verification",
    "final_payment_pending_verification",
)


def filter_purchase_orders(qs, user, ordering=ORDER_NEWEST, pending_field="status"):
    """Admin: tất cả. Supplier: đơn của NCC. Dealer: đơn của đại lý."""
    if is_admin(user):
        filtered = qs
    elif user.role == AccountRole.SUPPLIER:
        filtered = qs.filter(supplier__account=user)
    elif user.role == AccountRole.DEALER:
        filtered = qs.filter(dealer__account=user)
    else:
        return qs.none()
    pending_values = PO_PENDING_STATUSES if pending_field else None
    return _apply_order(filtered, ordering, pending_field, pending_values)

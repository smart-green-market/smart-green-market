"""Permission kiểm tra JWT buyer khớp gian hàng đại lý trên URL."""

from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from apps.accounts.models import AccountRole


class IsStorefrontCustomer(BasePermission):
    """Buyer storefront đã đăng nhập và token khớp dealer_slug trên request."""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role != AccountRole.BUYER or user.store_dealer_id is None:
            raise PermissionDenied("Chỉ khách hàng gian hàng đại lý được truy cập.")
        dealer_slug = view.kwargs.get("dealer_slug")
        if not dealer_slug:
            return True
        if user.store_dealer.slug != dealer_slug:
            raise PermissionDenied("Token không thuộc gian hàng đại lý này.")
        return True

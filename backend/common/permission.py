"""Lớp permission DRF phân quyền theo vai trò và trạng thái tài khoản."""

from rest_framework.permissions import BasePermission, IsAuthenticated
from apps.accounts.models import Account,AccountRole
from rest_framework.exceptions import PermissionDenied


class BaseRolePermission(BasePermission):
    """Permission cơ sở: yêu cầu đăng nhập và khớp role cố định."""

    role = None #class atribute của mỗi lớp

    def has_permission(self, request, view):
        """Trả True nếu user đã đăng nhập và có role khớp với lớp con."""
        return (
            request.user.is_authenticated #đã login chưa(token)
            and request.user.role == self.role #khớp role không
        )


class IsAdmin(BaseRolePermission):
    """Chỉ cho phép tài khoản admin."""

    role = AccountRole.ADMIN

class IsAdminOrSupplier(BasePermission):
    """Cho phép admin, supplier hoặc dealer."""

    def has_permission(self, request, view):
        """Trả True nếu user thuộc một trong các role được phép."""
        return (
            request.user.is_authenticated
            and request.user.role in (
                AccountRole.ADMIN,
                AccountRole.SUPPLIER,
                AccountRole.DEALER,
            )
        )


class IsAdminOrSupplierProfile(BasePermission):
    """Admin hoặc supplier — không gồm dealer (vd. giấy tờ NCC)."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (AccountRole.ADMIN, AccountRole.SUPPLIER)
        )
   
class IsSupplier(BaseRolePermission):
    """Chỉ cho phép tài khoản supplier."""

    role = AccountRole.SUPPLIER


class IsSupplierOrDealer(BasePermission):
    """Cho phép supplier hoặc dealer."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (AccountRole.SUPPLIER, AccountRole.DEALER)
        )


class IsDealer(BaseRolePermission):
    """Chỉ cho phép tài khoản dealer."""

    role = AccountRole.DEALER

class IsAdminOrDealer(BasePermission):
    """Cho phép admin hoặc dealer."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (AccountRole.ADMIN, AccountRole.DEALER))


class IsBuyer(BaseRolePermission):
    """Chỉ cho phép tài khoản buyer."""

    role = AccountRole.BUYER

class IsActive(BasePermission):
    """Yêu cầu tài khoản đã được kích hoạt (status = active)."""
    
    def has_permission(self, request, view):
        """Trả True nếu status active; raise PermissionDenied nếu chưa kích hoạt."""
        print("user:", request.user)
        print("authenticated:", request.user.is_authenticated)
        print("role:", request.user.role)
        print("status:", request.user.status)
        if request.user.status != "active":
            raise PermissionDenied("Tài khoản chưa được kích hoạt.")

        return True

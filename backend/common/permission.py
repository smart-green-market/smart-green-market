from rest_framework.permissions import BasePermission, IsAuthenticated
from apps.accounts.models import Account,AccountRole
from rest_framework.exceptions import PermissionDenied


class BaseRolePermission(BasePermission):
    role = None #class atribute của mỗi lớp
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated #đã login chưa(token)
            and request.user.role == self.role #khớp role không
        )


class IsAdmin(BaseRolePermission):
    role = AccountRole.ADMIN

class IsAdminOrSupplier(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (
                AccountRole.ADMIN,
                AccountRole.SUPPLIER,
                AccountRole.DEALER,
            )
        )
   
class IsSupplier(BaseRolePermission):
    role = AccountRole.SUPPLIER
   
class IsDealer(BaseRolePermission):
    role = AccountRole.DEALER

class IsBuyer(BaseRolePermission):
    role = AccountRole.BUYER

class IsActive(BasePermission):
    
    def has_permission(self, request, view):
        print("user:", request.user)
        print("authenticated:", request.user.is_authenticated)
        print("role:", request.user.role)
        print("status:", request.user.status)
        if request.user.status != "active":
            raise PermissionDenied("Tài khoản chưa được kích hoạt.")

        return True
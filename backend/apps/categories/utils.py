"""Helper nghiệp vụ danh mục hệ thống và danh mục riêng."""

from apps.accounts.models import AccountRole

from .models import Category, CategoryScope, CategoryStatus


def category_assignable_by_user(user, category: Category) -> bool:
    """User có được gắn danh mục này vào sản phẩm không."""
    if category.status != CategoryStatus.ACTIVE:
        return False
    if category.scope == CategoryScope.SYSTEM:
        return True
    return category.created_by_id == user.id


def is_system_category(category: Category) -> bool:
    return category.scope == CategoryScope.SYSTEM


def user_can_manage_category(user, category: Category) -> bool:
    """Admin hoặc người tạo danh mục riêng."""
    if user.role == AccountRole.ADMIN:
        return True
    if is_system_category(category):
        return False
    return category.created_by_id == user.id

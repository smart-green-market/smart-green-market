"""Nested serializers dùng chung cho danh sách chờ duyệt."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import AccountRole
from apps.categories.models import Category
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from common.openapi_enums import schema_choice_field

Account = get_user_model()


class ApprovalSupplierNestedSerializer(serializers.ModelSerializer):
    """Thông tin nhà cung cấp — nested trong danh sách chờ duyệt."""

    account_username = serializers.CharField(
        source="account.username",
        read_only=True,
    )
    account_full_name = serializers.CharField(
        source="account.full_name",
        read_only=True,
    )
    verification_status = schema_choice_field(
        choices=SupplierVerificationStatus.choices,
        read_only=True,
    )

    class Meta:
        model = Supplier
        fields = [
            "id",
            "company_name",
            "tax_code",
            "phone",
            "address",
            "verification_status",
            "account_username",
            "account_full_name",
        ]


class ApprovalAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản người tạo — nested trong danh sách chờ duyệt."""

    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    supplier_company_name = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            "id",
            "username",
            "full_name",
            "phone",
            "role",
            "supplier_company_name",
        ]

    def get_supplier_company_name(self, obj):
        profile = getattr(obj, "supplier_profile", None)
        return profile.company_name if profile else None


class ApprovalCategoryNestedSerializer(serializers.ModelSerializer):
    """Thông tin danh mục — nested trong danh sách sản phẩm."""

    class Meta:
        model = Category
        fields = ["id", "name", "status"]

"""Nested serializers dùng chung cho danh sách chờ duyệt."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.models import AccountRole
from apps.categories.models import Category, CategoryStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from common.openapi_enums import schema_choice_field

Account = get_user_model()


class ApprovalSupplierNestedSerializer(serializers.ModelSerializer):
    """Thông tin nhà cung cấp — nested trong danh sách chờ duyệt."""

    account_username = serializers.CharField(
        source="account.username",
        read_only=True,
        help_text="Username tài khoản NCC",
    )
    account_full_name = serializers.CharField(
        source="account.full_name",
        read_only=True,
        help_text="Họ tên chủ tài khoản",
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
        extra_kwargs = {
            "id": {"help_text": "ID hồ sơ NCC"},
            "company_name": {"help_text": "Tên công ty / trang trại"},
            "tax_code": {"help_text": "Mã số thuế"},
            "phone": {"help_text": "Hotline liên hệ"},
            "address": {"help_text": "Địa chỉ"},
        }


class ApprovalAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản người tạo — nested trong danh sách chờ duyệt."""

    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    profile_name = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            "id",
            "username",
            "full_name",
            "phone",
            "role",
            "profile_name",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID tài khoản"},
            "username": {"help_text": "Tên đăng nhập"},
            "full_name": {"help_text": "Họ và tên"},
            "phone": {"help_text": "Số điện thoại"},
        }

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_profile_name(self, obj):
        """Trả tên hồ sơ supplier/dealer nếu có."""
        supplier = getattr(obj, "supplier_profile", None)
        if supplier is not None:
            return supplier.company_name
        dealer = getattr(obj, "dealer_profile", None)
        if dealer is not None:
            return dealer.store_name
        return None


class ApprovalDealerNestedSerializer(serializers.ModelSerializer):
    """Thông tin đại lý — nested trong danh sách."""

    account_username = serializers.CharField(
        source="account.username",
        read_only=True,
        help_text="Username tài khoản đại lý",
    )
    status = schema_choice_field(choices=DealerProfileStatus.choices, read_only=True)

    class Meta:
        model = DealerProfile
        fields = [
            "id",
            "store_name",
            "store_address",
            "status",
            "account_username",
        ]
        extra_kwargs = {
            "store_name": {"help_text": "Tên cửa hàng"},
            "store_address": {"help_text": "Địa chỉ cửa hàng"},
        }


class ApprovalCategoryNestedSerializer(serializers.ModelSerializer):
    """Thông tin danh mục — nested trong danh sách sản phẩm."""

    status = schema_choice_field(choices=CategoryStatus.choices, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "status"]
        extra_kwargs = {
            "id": {"help_text": "ID danh mục"},
            "name": {"help_text": "Tên danh mục"},
        }

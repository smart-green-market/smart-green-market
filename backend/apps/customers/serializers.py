"""Serializer cho hồ sơ khách hàng và địa chỉ."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import AccountRole, AccountStatus
from common.openapi_enums import schema_choice_field

from .models import CustomerAddress, CustomerProfile

Account = get_user_model()


class CustomerAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản buyer tối giản."""

    role = schema_choice_field(choices=AccountRole.choices, read_only=True)
    status = schema_choice_field(choices=AccountStatus.choices, read_only=True)
    store_dealer_id = serializers.IntegerField(
        read_only=True,
        allow_null=True,
    )
    store_dealer_slug = serializers.SlugField(
        source="store_dealer.slug",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Account
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "role",
            "status",
            "store_dealer_id",
            "store_dealer_slug",
        ]


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ buyer gắn account storefront."""

    user = CustomerAccountNestedSerializer(read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "user",
            "favorite_category",
            "total_orders",
            "total_spent",
            "loyalty_points",
            "last_order_at",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "total_orders",
            "total_spent",
            "loyalty_points",
            "last_order_at",
            "note",
            "created_at",
            "updated_at",
        ]


class CustomerProfileUpdateSerializer(serializers.ModelSerializer):
    """Buyer cập nhật sở thích; đại lý cập nhật note qua serializer riêng."""

    class Meta:
        model = CustomerProfile
        fields = ["favorite_category"]


class CustomerAddressSerializer(serializers.ModelSerializer):
    """Địa chỉ nhận hàng của buyer."""

    customer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "customer",
            "receiver_name",
            "receiver_phone",
            "address",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["customer", "created_at", "updated_at"]

    def _unset_other_defaults(self, customer):
        CustomerAddress.objects.filter(
            customer=customer,
            is_default=True,
        ).exclude(pk=self.instance.pk if self.instance else None).update(is_default=False)

    def create(self, validated_data):
        if validated_data.get("is_default"):
            self._unset_other_defaults(validated_data["customer"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_default"):
            self._unset_other_defaults(instance.customer)
        return super().update(instance, validated_data)

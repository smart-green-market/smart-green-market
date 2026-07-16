"""Serializer cho hồ sơ khách hàng và địa chỉ."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.models import AccountRole, AccountStatus
from apps.customers.storefront_catalog_serializers import StorefrontProductCategorySerializer
from apps.marketing.segment_defaults import resolve_primary_segment_membership
from apps.marketing.serializers import CustomerProfileSegmentSerializer
from apps.loyalty.serializers import serialize_loyalty_status
from common.avatar import build_avatar_url, save_account_avatar
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload

from .models import CustomerAddress, CustomerProfile

Account = get_user_model()


class CustomerAccountNestedSerializer(serializers.ModelSerializer):
    """Thông tin tài khoản buyer tối giản."""

    avatar_url = serializers.SerializerMethodField()
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
            "avatar_url",
            "role",
            "status",
            "store_dealer_id",
            "store_dealer_slug",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, obj):
        return build_avatar_url(obj, self.context.get("request"))


class CustomerAddressReadSerializer(serializers.ModelSerializer):
    """Địa chỉ nhận hàng — dùng khi nested trong hồ sơ buyer."""

    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "receiver_name",
            "receiver_phone",
            "address",
            "is_default",
            "created_at",
            "updated_at",
        ]


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ buyer gắn account storefront."""

    user = CustomerAccountNestedSerializer(read_only=True)
    favorite_category = StorefrontProductCategorySerializer(read_only=True)
    addresses = CustomerAddressReadSerializer(many=True, read_only=True)
    default_address = serializers.SerializerMethodField()
    segments = serializers.SerializerMethodField()
    primary_segment = serializers.SerializerMethodField()

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "user",
            "favorite_category",
            "addresses",
            "default_address",
            "segments",
            "primary_segment",
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
            "addresses",
            "default_address",
            "segments",
            "primary_segment",
            "total_orders",
            "total_spent",
            "loyalty_points",
            "last_order_at",
            "note",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(CustomerProfileSegmentSerializer(many=True))
    def get_segments(self, obj):
        memberships = obj.segment_memberships.all()
        return CustomerProfileSegmentSerializer(
            memberships,
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(CustomerProfileSegmentSerializer(allow_null=True))
    def get_primary_segment(self, obj):
        memberships = list(obj.segment_memberships.all())
        primary = resolve_primary_segment_membership(memberships)
        if primary is None:
            return None
        return CustomerProfileSegmentSerializer(primary, context=self.context).data

    @extend_schema_field(CustomerAddressReadSerializer(allow_null=True))
    def get_default_address(self, obj):
        addresses = list(obj.addresses.all())
        default = next((item for item in addresses if item.is_default), None)
        if default is None and addresses:
            default = addresses[0]
        if default is None:
            return None
        return CustomerAddressReadSerializer(default, context=self.context).data


class StorefrontCustomerProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ buyer trên storefront — không lộ phân khúc nội bộ."""

    user = CustomerAccountNestedSerializer(read_only=True)
    favorite_category = StorefrontProductCategorySerializer(read_only=True)
    addresses = CustomerAddressReadSerializer(many=True, read_only=True)
    default_address = serializers.SerializerMethodField()
    loyalty = serializers.SerializerMethodField()

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "user",
            "favorite_category",
            "addresses",
            "default_address",
            "total_orders",
            "total_spent",
            "loyalty_points",
            "loyalty",
            "last_order_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    @extend_schema_field(serializers.DictField())
    def get_loyalty(self, obj):
        return serialize_loyalty_status(obj)

    @extend_schema_field(CustomerAddressReadSerializer(allow_null=True))
    def get_default_address(self, obj):
        addresses = list(obj.addresses.all())
        default = next((item for item in addresses if item.is_default), None)
        if default is None and addresses:
            default = addresses[0]
        if default is None:
            return None
        return CustomerAddressReadSerializer(default, context=self.context).data


class CustomerProfileUpdateSerializer(serializers.ModelSerializer):
    """Buyer cập nhật sở thích, thông tin liên hệ và avatar trên gian hàng."""

    full_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    avatar = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = CustomerProfile
        fields = ["favorite_category", "full_name", "phone", "avatar"]

    def validate_avatar(self, file):
        validate_image_upload(file)
        return file

    def update(self, instance, validated_data):
        avatar = validated_data.pop("avatar", None)
        user_fields = {}
        if "full_name" in validated_data:
            user_fields["full_name"] = validated_data.pop("full_name")
        if "phone" in validated_data:
            user_fields["phone"] = validated_data.pop("phone")

        instance = super().update(instance, validated_data)

        if user_fields:
            user = instance.user
            for field, value in user_fields.items():
                setattr(user, field, value)
            user.save(update_fields=[*user_fields.keys(), "updated_at"])

        if avatar is not None:
            save_account_avatar(instance.user, avatar)

        return instance


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

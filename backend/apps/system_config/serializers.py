"""Serializer cập nhật cấu hình hệ thống — admin only."""

from rest_framework import serializers

from .models import SystemSettings


class SystemSettingsUpdateSerializer(serializers.ModelSerializer):
    """PATCH một phần cấu hình nghiệp vụ."""

    class Meta:
        model = SystemSettings
        fields = [
            "max_upload_image_size_mb",
            "max_categories_per_supplier",
            "max_products_per_supplier",
            "max_images_per_product",
            "max_images_per_certification",
            "max_login_attempts",
            "login_lockout_minutes",
            "min_order_amount",
            "max_order_amount",
            "min_deposit_percent",
            "max_deposit_percent",
            "default_deposit_percent",
            "min_delivery_lead_days",
            "max_delivery_delay_days",
            "shipping_fee",
            "min_lead_hours",
            "morning_cutoff_hour",
            "max_booking_days",
        ]

    def validate_max_upload_image_size_mb(self, value):
        if not 1 <= value <= 50:
            raise serializers.ValidationError("Dung lượng ảnh tối đa phải từ 1 đến 50 MB.")
        return value

    def validate_morning_cutoff_hour(self, value):
        if not 0 <= value <= 23:
            raise serializers.ValidationError("Giờ cut-off phải từ 0 đến 23.")
        return value

    def validate(self, attrs):
        instance = self.instance or SystemSettings()
        data = {
            field: attrs.get(field, getattr(instance, field))
            for field in self.Meta.fields
        }

        if data["min_order_amount"] > data["max_order_amount"]:
            raise serializers.ValidationError(
                {"min_order_amount": "Giá trị đơn tối thiểu không được lớn hơn tối đa."}
            )

        min_dep = data["min_deposit_percent"]
        max_dep = data["max_deposit_percent"]
        default_dep = data["default_deposit_percent"]
        if min_dep > max_dep:
            raise serializers.ValidationError(
                {"min_deposit_percent": "Tỷ lệ cọc tối thiểu không được lớn hơn tối đa."}
            )
        if not (min_dep <= default_dep <= max_dep):
            raise serializers.ValidationError(
                {
                    "default_deposit_percent": (
                        "Tỷ lệ cọc mặc định phải nằm trong khoảng min–max."
                    )
                }
            )

        if data["max_booking_days"] < 1:
            raise serializers.ValidationError(
                {"max_booking_days": "Số ngày đặt trước phải >= 1."}
            )

        if data["max_delivery_delay_days"] < 1:
            raise serializers.ValidationError(
                {"max_delivery_delay_days": "Số ngày trễ tối đa phải >= 1."}
            )

        return attrs

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["updated_by"] = request.user
        return super().update(instance, validated_data)

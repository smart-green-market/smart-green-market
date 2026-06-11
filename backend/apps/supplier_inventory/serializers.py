from datetime import timedelta
from rest_framework import serializers
from .models import InventoryBatch, InventoryWastage
from apps.categories.models import CategoryStatus


class InventoryBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryBatch
        fields = "__all__"
        read_only_fields = [
            "remaining_quantity",
            "expiry_date",
            "status",
            "created_at",
            "updated_at",
            "deleted_at",
        ]
    def validate(self, data):
        import_date = data.get("import_date")
        expiry_date = data.get("expiry_date")

        if import_date and expiry_date and expiry_date <= import_date:
            raise serializers.ValidationError(
                {"expiry_date": "Ngày hết hạn phải lớn hơn ngày nhập kho."}
            )
        return data

    def create(self, validated_data):
        validated_data["remaining_quantity"] = validated_data.get("quantity", 0)

        product = validated_data.get("supplier_product")
        import_date = validated_data.get("import_date")
        

        if product and import_date:
            storage_days = product.storage_duration_days
            if storage_days is None:
                raise serializers.ValidationError(
                    {"import_date": "Sản phẩm này chưa được cấu hình số ngày bảo quản (storage_duration_days)."}
                )
            validated_data["expiry_date"] = import_date + timedelta(days=storage_days)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        product = validated_data.get("supplier_product") or instance.supplier_product
        import_date = validated_data.get("import_date") or instance.import_date
        if "import_date" in validated_data or "supplier_product" in validated_data:
            storage_days = product.storage_duration_days
            if storage_days is None:
                raise serializers.ValidationError(
                    {"import_date": "Sản phẩm này chưa được cấu hình số ngày bảo quản (storage_duration_days)."}
                )
            validated_data["expiry_date"] = import_date + timedelta(days=storage_days)

        if "quantity" in validated_data:
            old_quantity = instance.quantity
            new_quantity = validated_data["quantity"]
            diff = new_quantity - old_quantity
            instance.remaining_quantity = max(0, instance.remaining_quantity + diff)
        return super().update(instance, validated_data)

class InventoryWastageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryWastage
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "created_at",
        ]

    def validate(self, attrs):
        batch = attrs.get("batch") or (self.instance.batch if self.instance else None)
        quantity = attrs.get("quantity") if "quantity" in attrs else (self.instance.quantity if self.instance else None)

        if batch and quantity is not None:
            if self.instance:
                if batch != self.instance.batch:
                    if quantity > batch.remaining_quantity:
                        raise serializers.ValidationError(
                            {"quantity": f"Không đủ tồn kho ở lô mới. Tồn kho khả dụng: {batch.remaining_quantity}"}
                        )
                else:
                    diff = quantity - self.instance.quantity
                    if diff > batch.remaining_quantity:
                        raise serializers.ValidationError(
                            {"quantity": f"Không đủ tồn kho. Cần thêm {diff} sản phẩm, nhưng tồn kho chỉ còn {batch.remaining_quantity}"}
                        )
            else:
                if quantity > batch.remaining_quantity:
                    raise serializers.ValidationError(
                        {"quantity": f"Không đủ tồn kho. Số lượng còn lại: {batch.remaining_quantity}"}
                    )
        return attrs



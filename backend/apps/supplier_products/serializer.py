from rest_framework import serializers

from apps.suppliers.models import SupplierVerificationStatus
from .models import SupplierProduct, SupplierProductImage, SupplierProductStatus


class SupplierProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierProductImage
        fields = [
            "id",
            "supplier_product",
            "image_url",
            "is_thumbnail",
            "sort_order",
            "created_at",
        ]
        read_only_fields = ["created_at"]
        extra_kwargs = {
            "supplier_product": {"help_text": "ID sản phẩm cần gắn ảnh"},
            "image_url": {"help_text": "URL ảnh sản phẩm"},
            "is_thumbnail": {"help_text": "true = ảnh đại diện (chỉ 1 ảnh/sản phẩm)"},
            "sort_order": {"help_text": "Thứ tự hiển thị (số nhỏ hiện trước)"},
        }

    def validate_supplier_product(self, product):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated and user.role == "supplier":
            profile = getattr(user, "supplier_profile", None)
            if not profile or product.supplier_id != profile.id:
                raise serializers.ValidationError(
                    "Bạn không có quyền thao tác ảnh của sản phẩm này."
                )
        return product

    def _ensure_single_thumbnail(self, product, current_id=None):
        if not self.validated_data.get("is_thumbnail", False):
            return
        qs = SupplierProductImage.objects.filter(
            supplier_product=product,
            is_thumbnail=True,
        )
        if current_id:
            qs = qs.exclude(pk=current_id)
        qs.update(is_thumbnail=False)

    def create(self, validated_data):
        image = super().create(validated_data)
        if image.is_thumbnail:
            SupplierProductImage.objects.filter(
                supplier_product=image.supplier_product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)
        return image

    def update(self, instance, validated_data):
        image = super().update(instance, validated_data)
        if image.is_thumbnail:
            SupplierProductImage.objects.filter(
                supplier_product=image.supplier_product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)
        return image


class SupplierProductSerializer(serializers.ModelSerializer):
    images = SupplierProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = SupplierProduct
        fields = "__all__"
        read_only_fields = [
            "supplier",
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "category": {"help_text": "ID danh mục sản phẩm"},
            "name": {"help_text": "Tên sản phẩm"},
            "slug": {"help_text": "Slug URL (unique trong phạm vi supplier)"},
            "unit": {"help_text": "Đơn vị bán (kg, túi, thùng...)"},
            "description": {"help_text": "Mô tả chi tiết sản phẩm", "required": False},
            "storage_duration_days": {"help_text": "Số ngày bảo quản được", "required": False},
            "min_storage_temp": {"help_text": "Nhiệt độ bảo quản tối thiểu (°C)", "required": False},
            "max_storage_temp": {"help_text": "Nhiệt độ bảo quản tối đa (°C)", "required": False},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            profile = getattr(request.user, "supplier_profile", None)
            if profile and profile.verification_status != SupplierVerificationStatus.APPROVED:
                raise serializers.ValidationError(
                    "Supplier chưa được duyệt, không thể tạo/sửa sản phẩm."
                )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["supplier"] = request.user.supplier_profile
        validated_data.setdefault("status", SupplierProductStatus.PENDING)
        return super().create(validated_data)


class VerifySupplierProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierProduct
        fields = ["status", "rejection_reason"]

from .models import CultivationProcess  # thêm import

class CultivationProcessSerializer(serializers.ModelSerializer):
    class Meta:
        model = CultivationProcess
        fields = [
            "id",
            "supplier_product",
            "step_order",
            "process_name",
            "description",
            "created_at",
        ]
        read_only_fields = ["created_at"]
        extra_kwargs = {
            "supplier_product": {"help_text": "ID sản phẩm"},
            "step_order": {"help_text": "Thứ tự bước (unique/sản phẩm)"},
            "process_name": {"help_text": "Tên bước (vd: Gieo hạt, Thu hoạch)"},
            "description": {"help_text": "Mô tả chi tiết bước canh tác", "required": False},
        }

    def validate_supplier_product(self, product):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated and user.role == "supplier":
            profile = getattr(user, "supplier_profile", None)
            if not profile or product.supplier_id != profile.id:
                raise serializers.ValidationError(
                    "Bạn không có quyền thao tác quy trình của sản phẩm này."
                )
        return product
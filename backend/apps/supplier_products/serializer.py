from rest_framework import serializers

from common.approval_nested import (
    ApprovalCategoryNestedSerializer,
    ApprovalSupplierNestedSerializer,
)
from common.business_rules import (
    MAX_IMAGES_PER_PRODUCT,
    MAX_PRODUCTS_PER_SUPPLIER,
    allowed_image_extensions_label,
)
from common.openapi_enums import schema_choice_field
from common.validators import validate_image_upload
from apps.categories.models import CategoryStatus
from apps.suppliers.models import SupplierVerificationStatus
from .models import SupplierProduct, SupplierProductImage, SupplierProductStatus

_IMAGE_FIELD_HELP = (
    f"Ảnh sản phẩm ({allowed_image_extensions_label()} — tối đa 5MB/ảnh)"
)


def _ensure_product_image_permission(user, product):
    if not user or not user.is_authenticated:
        return
    if user.role == "admin":
        return
    if user.role in ("supplier", "dealer"):
        profile = getattr(user, "supplier_profile", None)
        if not profile or product.supplier_id != profile.id:
            raise serializers.ValidationError(
                "Bạn không có quyền thao tác ảnh của sản phẩm này."
            )
        return
    raise serializers.ValidationError(
        "Bạn không có quyền thao tác ảnh của sản phẩm này."
    )


def _collect_upload_files(request):
    return request.FILES.getlist("images")


class SupplierProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.FileField(
        required=False,
        help_text=_IMAGE_FIELD_HELP,
    )

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
            "is_thumbnail": {"help_text": "true = ảnh đại diện (chỉ 1 ảnh/sản phẩm)"},
            "sort_order": {"help_text": "Thứ tự hiển thị (số nhỏ hiện trước)"},
        }

    def validate_image_url(self, file):
        if file and hasattr(file, "read"):
            validate_image_upload(file)
        return file

    def validate(self, attrs):
        product = attrs.get("supplier_product") or getattr(
            self.instance, "supplier_product", None
        )
        if product and self.instance is None:
            if product.images.count() >= MAX_IMAGES_PER_PRODUCT:
                raise serializers.ValidationError(
                    f"Mỗi sản phẩm tối đa {MAX_IMAGES_PER_PRODUCT} ảnh."
                )
        if self.instance is None and not attrs.get("image_url"):
            raise serializers.ValidationError(
                {"image_url": "Vui lòng chọn ảnh để upload."}
            )
        return attrs

    def validate_supplier_product(self, product):
        _ensure_product_image_permission(
            self.context.get("request").user
            if self.context.get("request")
            else None,
            product,
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
        new_file = validated_data.get("image_url")
        if new_file and instance.image_url:
            instance.image_url.delete(save=False)
        image = super().update(instance, validated_data)
        if image.is_thumbnail:
            SupplierProductImage.objects.filter(
                supplier_product=image.supplier_product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)
        return image


class SupplierProductImageBulkUploadSerializer(serializers.Serializer):
    """Upload nhiều ảnh sản phẩm trong một request multipart."""

    supplier_product = serializers.PrimaryKeyRelatedField(
        queryset=SupplierProduct.objects.all(),
        help_text="ID sản phẩm cần gắn ảnh",
    )
    is_thumbnail = serializers.BooleanField(
        required=False,
        default=False,
        help_text="true = ảnh đầu tiên trong batch làm ảnh đại diện",
    )

    def validate(self, attrs):
        request = self.context["request"]
        product = attrs["supplier_product"]
        _ensure_product_image_permission(request.user, product)

        files = _collect_upload_files(request)
        if not files:
            raise serializers.ValidationError(
                {"images": "Vui lòng chọn ít nhất 1 ảnh (field `images`)."}
            )

        for file in files:
            validate_image_upload(file)

        current_count = product.images.count()
        if current_count + len(files) > MAX_IMAGES_PER_PRODUCT:
            remaining = max(0, MAX_IMAGES_PER_PRODUCT - current_count)
            raise serializers.ValidationError(
                {
                    "images": (
                        f"Mỗi sản phẩm tối đa {MAX_IMAGES_PER_PRODUCT} ảnh. "
                        f"Còn upload được {remaining} ảnh."
                    )
                }
            )

        attrs["files"] = files
        return attrs

    def create(self, validated_data):
        product = validated_data["supplier_product"]
        files = validated_data["files"]
        set_thumbnail = validated_data.get("is_thumbnail", False)
        base_sort = (
            product.images.order_by("-sort_order").values_list("sort_order", flat=True).first()
            or -1
        ) + 1

        created = []
        for index, file in enumerate(files):
            is_thumbnail = set_thumbnail and index == 0
            image = SupplierProductImage.objects.create(
                supplier_product=product,
                image_url=file,
                is_thumbnail=is_thumbnail,
                sort_order=base_sort + index,
            )
            if is_thumbnail:
                SupplierProductImage.objects.filter(
                    supplier_product=product,
                    is_thumbnail=True,
                ).exclude(pk=image.pk).update(is_thumbnail=False)
            created.append(image)
        return created


class SupplierProductReadSerializer(serializers.ModelSerializer):
    images = SupplierProductImageSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=SupplierProductStatus.choices, read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = SupplierProduct
        fields = [
            "id",
            "name",
            "slug",
            "unit",
            "description",
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
            "status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
            "images",
        ]


class SupplierProductListSerializer(SupplierProductReadSerializer):
    """Sản phẩm kèm NCC và danh mục — dùng cho danh sách chờ duyệt."""

    supplier = ApprovalSupplierNestedSerializer(read_only=True)
    category = ApprovalCategoryNestedSerializer(read_only=True)

    class Meta(SupplierProductReadSerializer.Meta):
        fields = SupplierProductReadSerializer.Meta.fields + ["supplier", "category"]


class SupplierProductSerializer(serializers.ModelSerializer):
    images = SupplierProductImageSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=SupplierProductStatus.choices, read_only=True)

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

    def validate_category(self, category):
        if category.status != CategoryStatus.ACTIVE:
            raise serializers.ValidationError(
                "Danh mục chưa được duyệt, không thể gắn vào sản phẩm."
            )
        return category

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
        supplier = request.user.supplier_profile
        if SupplierProduct.objects.filter(supplier=supplier).count() >= MAX_PRODUCTS_PER_SUPPLIER:
            raise serializers.ValidationError(
                f"Mỗi nhà cung cấp tối đa {MAX_PRODUCTS_PER_SUPPLIER} sản phẩm."
            )
        validated_data["supplier"] = supplier
        validated_data.setdefault("status", SupplierProductStatus.PENDING)
        return super().create(validated_data)


class VerifySupplierProductSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=[
            SupplierProductStatus.ACTIVE,
            SupplierProductStatus.REJECTED,
            SupplierProductStatus.INACTIVE,
        ],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )

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
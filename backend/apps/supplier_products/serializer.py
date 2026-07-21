"""Serializer cho sản phẩm, ảnh sản phẩm và quy trình canh tác."""

from decimal import Decimal

from rest_framework import serializers

from common.approval_nested import (
    ApprovalCategoryNestedSerializer,
    ApprovalSupplierNestedSerializer,
)
from apps.system_config.services import get_system_settings
from common.business_rules import allowed_image_extensions_label
from common.openapi_enums import schema_choice_field
from common.validators import require_rejection_reason, validate_image_upload
from apps.categories.utils import category_assignable_by_user
from apps.product_catalog.models import ProductMaster
from apps.product_catalog.serializers import ProductMasterListSerializer
from apps.suppliers.models import SupplierVerificationStatus
from apps.purchase_orders.models import PurchaseOrderStatus
from apps.dealer_products.inventory_expiry import MAX_STORAGE_DURATION_DAYS
from .catalog_services import apply_supplier_product_catalog_rules
from .order_demand import purchase_order_items_for_product
from .models import SupplierProduct, SupplierProductImage, SupplierProductStatus

_IMAGE_FIELD_HELP = (
    f"Ảnh sản phẩm ({allowed_image_extensions_label()} — tối đa 5MB/ảnh)"
)


def _ensure_product_image_permission(user, product):
    """Kiểm tra quyền thao tác ảnh của sản phẩm."""
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
    """Thu thập danh sách file upload từ field `images`."""
    return request.FILES.getlist("images")


class SupplierProductImageSerializer(serializers.ModelSerializer):
    """Serializer upload và cập nhật ảnh sản phẩm."""

    image_url = serializers.FileField(
        required=False,
        help_text=_IMAGE_FIELD_HELP,
    )

    class Meta:
        """Cấu hình trường ảnh sản phẩm."""

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
        """Kiểm tra định dạng và kích thước file ảnh."""
        if file and hasattr(file, "read"):
            validate_image_upload(file)
        return file

    def validate(self, attrs):
        """Kiểm tra giới hạn số ảnh và bắt buộc có file khi tạo mới."""
        product = attrs.get("supplier_product") or getattr(
            self.instance, "supplier_product", None
        )
        if product and self.instance is None:
            if product.images.count() >= get_system_settings().max_images_per_product:
                raise serializers.ValidationError(
                    f"Mỗi sản phẩm tối đa {get_system_settings().max_images_per_product} ảnh."
                )
        if self.instance is None and not attrs.get("image_url"):
            raise serializers.ValidationError(
                {"image_url": "Vui lòng chọn ảnh để upload."}
            )
        return attrs

    def validate_supplier_product(self, product):
        """Kiểm tra quyền thao tác ảnh trên sản phẩm."""
        _ensure_product_image_permission(
            self.context.get("request").user
            if self.context.get("request")
            else None,
            product,
        )
        return product

    def _ensure_single_thumbnail(self, product, current_id=None):
        """Đảm bảo chỉ một ảnh đại diện trên mỗi sản phẩm."""
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
        """Tạo ảnh mới và bỏ thumbnail các ảnh khác nếu cần."""
        image = super().create(validated_data)
        if image.is_thumbnail:
            SupplierProductImage.objects.filter(
                supplier_product=image.supplier_product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)
        return image

    def update(self, instance, validated_data):
        """Cập nhật ảnh, xóa file cũ và đồng bộ thumbnail."""
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
        """Kiểm tra quyền, file upload và giới hạn số ảnh."""
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
        if current_count + len(files) > get_system_settings().max_images_per_product:
            remaining = max(0, get_system_settings().max_images_per_product - current_count)
            raise serializers.ValidationError(
                {
                    "images": (
                        f"Mỗi sản phẩm tối đa {get_system_settings().max_images_per_product} ảnh. "
                        f"Còn upload được {remaining} ảnh."
                    )
                }
            )

        attrs["files"] = files
        return attrs

    def create(self, validated_data):
        """Tạo nhiều ảnh sản phẩm từ danh sách file upload."""
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
    """Serializer đọc thông tin sản phẩm kèm ảnh."""

    images = SupplierProductImageSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=SupplierProductStatus.choices, read_only=True)
    product_master = ProductMasterListSerializer(read_only=True)
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        """Cấu hình trường đọc sản phẩm."""

        model = SupplierProduct
        fields = [
            "id",
            "name",
            "slug",
            "unit",
            "product_master",
            "wholesale_price",
            "daily_production_capacity",
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
        extra_kwargs = {
            "id": {"help_text": "ID sản phẩm"},
            "name": {"help_text": "Tên sản phẩm"},
            "slug": {"help_text": "Slug URL (unique trong phạm vi NCC)"},
            "unit": {"help_text": "Đơn vị bán (kg, túi, thùng...)"},
            "wholesale_price": {"help_text": "Giá bán sỉ cho đại lý (VND)"},
            "daily_production_capacity": {
                "help_text": "Năng lực sản xuất TB/ngày (cùng đơn vị unit)",
            },
            "description": {"help_text": "Mô tả chi tiết"},
            "storage_duration_days": {"help_text": "Số ngày bảo quản được"},
            "min_storage_temp": {"help_text": "Nhiệt độ bảo quản tối thiểu (°C)"},
            "max_storage_temp": {"help_text": "Nhiệt độ bảo quản tối đa (°C)"},
            "verified_by": {"help_text": "ID admin duyệt sản phẩm"},
            "verified_at": {"help_text": "Thời điểm duyệt/từ chối"},
            "rejection_reason": {"help_text": "Lý do từ chối (nếu status=rejected)"},
            "created_at": {"help_text": "Thời điểm tạo"},
            "updated_at": {"help_text": "Thời điểm cập nhật gần nhất"},
        }


class SupplierProductPurchaseOrderSerializer(serializers.Serializer):
    """Phiếu nhập đại lý có chứa sản phẩm NCC — dùng ở chi tiết sản phẩm."""

    id = serializers.IntegerField(source="purchase_order.id", help_text="ID phiếu nhập")
    order_code = serializers.CharField(
        source="purchase_order.order_code",
        help_text="Mã phiếu nhập",
    )
    status = schema_choice_field(
        choices=PurchaseOrderStatus.choices,
        source="purchase_order.status",
    )
    dealer_id = serializers.IntegerField(
        source="purchase_order.dealer_id",
        help_text="ID hồ sơ đại lý",
    )
    dealer_store_name = serializers.CharField(
        source="purchase_order.dealer.store_name",
        help_text="Tên cửa hàng đại lý",
    )
    quantity = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Số lượng đại lý đặt mặt hàng này",
    )
    unit = serializers.CharField(
        source="supplier_product.unit",
        help_text="Đơn vị tính",
    )
    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Đơn giá sỉ snapshot",
    )
    subtotal = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Thành tiền dòng",
    )
    requested_delivery_time = serializers.DateTimeField(
        source="purchase_order.requested_delivery_time",
        help_text="Thời gian giao mong muốn",
    )
    item_note = serializers.CharField(source="note", help_text="Ghi chú dòng sản phẩm")
    order_note = serializers.CharField(
        source="purchase_order.note",
        help_text="Ghi chú phiếu nhập",
    )
    created_at = serializers.DateTimeField(
        source="purchase_order.created_at",
        help_text="Thời điểm đại lý tạo phiếu",
    )


class SupplierProductListSerializer(SupplierProductReadSerializer):
    """Sản phẩm kèm NCC và danh mục — dùng cho danh sách chờ duyệt."""

    supplier = ApprovalSupplierNestedSerializer(read_only=True)
    category = ApprovalCategoryNestedSerializer(read_only=True)
    pending_order_quantity = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
        default=Decimal("0"),
        help_text="Tổng SL đại lý đặt — phiếu chờ NCC xác nhận",
    )
    preparation_quantity = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
        default=Decimal("0"),
        help_text="Tổng SL cần chuẩn bị — phiếu đã xác nhận, chưa giao hàng",
    )
    quantity_discount_tiers = serializers.SerializerMethodField(
        help_text="Bậc giảm giá theo số lượng đặt (NCC cấu hình)",
    )

    class Meta(SupplierProductReadSerializer.Meta):
        """Mở rộng trường thêm nhà cung cấp và danh mục."""

        fields = SupplierProductReadSerializer.Meta.fields + [
            "supplier",
            "category",
            "pending_order_quantity",
            "preparation_quantity",
            "quantity_discount_tiers",
        ]

    def get_quantity_discount_tiers(self, obj):
        from .quantity_discount import get_quantity_discount_tiers_for_product

        return get_quantity_discount_tiers_for_product(obj)


class SupplierProductPendingConfirmationSerializer(SupplierProductListSerializer):
    """Sản phẩm có đơn chờ NCC xác nhận — dùng GET .../pending-confirmation/."""

    pending_purchase_order_count = serializers.IntegerField(
        read_only=True,
        help_text="Số phiếu nhập distinct ở trạng thái pending_supplier_confirmation",
    )

    class Meta(SupplierProductListSerializer.Meta):
        fields = SupplierProductListSerializer.Meta.fields + [
            "pending_purchase_order_count",
        ]


class SupplierProductDetailSerializer(SupplierProductListSerializer):
    """Chi tiết sản phẩm NCC — kèm danh sách phiếu nhập theo mặt hàng."""

    purchase_orders = serializers.SerializerMethodField(
        help_text="Phiếu nhập đại lý còn hiệu lực có chứa mặt hàng này",
    )

    class Meta(SupplierProductListSerializer.Meta):
        fields = SupplierProductListSerializer.Meta.fields + ["purchase_orders"]

    def get_purchase_orders(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return []
        if user.role not in ("admin", "supplier"):
            return []
        if user.role == "supplier":
            profile = getattr(user, "supplier_profile", None)
            if not profile or obj.supplier_id != profile.id:
                return []
        items = self.context.get("purchase_order_items")
        if items is None:
            items = purchase_order_items_for_product(obj)
        return SupplierProductPurchaseOrderSerializer(
            items,
            many=True,
            context=self.context,
        ).data


class SupplierProductSerializer(serializers.ModelSerializer):
    """Serializer tạo và cập nhật sản phẩm nhà cung cấp — 2 luồng catalog."""

    images = SupplierProductImageSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=SupplierProductStatus.choices, read_only=True)
    product_master = serializers.PrimaryKeyRelatedField(
        queryset=ProductMaster.objects.all(),
        required=False,
        allow_null=True,
        help_text=(
            "**Danh mục system:** bắt buộc — ID từ GET /api/product-masters/?category_id=. "
            "**Danh mục riêng:** tuỳ chọn (Product Catalog Link)."
        ),
    )
    name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="**Danh mục riêng:** bắt buộc tên tự do. **Danh mục system:** bỏ qua (lấy từ master).",
    )
    unit = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="**Danh mục riêng:** bắt buộc. **Danh mục system:** bỏ qua (lấy từ master).",
    )
    slug = serializers.SlugField(read_only=True)

    class Meta:
        """Cấu hình trường ghi sản phẩm."""

        model = SupplierProduct
        fields = [
            "id",
            "category",
            "product_master",
            "name",
            "slug",
            "unit",
            "wholesale_price",
            "daily_production_capacity",
            "description",
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
            "status",
            "images",
            "supplier",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "supplier",
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "created_at",
            "updated_at",
            "images",
        ]
        extra_kwargs = {
            "category": {
                "help_text": "ID danh mục — system hoặc custom (NCC tự tạo)",
            },
            "wholesale_price": {
                "help_text": "Giá bán sỉ cho đại lý (VND)",
                "required": False,
            },
            "daily_production_capacity": {
                "help_text": "Năng lực sản xuất TB/ngày (cùng đơn vị unit) — không phải tồn kho",
                "required": False,
            },
            "description": {"help_text": "Mô tả riêng của NCC", "required": False},
            "storage_duration_days": {"help_text": "Số ngày bảo quản được", "required": False},
            "min_storage_temp": {"help_text": "Nhiệt độ bảo quản tối thiểu (°C)", "required": False},
            "max_storage_temp": {"help_text": "Nhiệt độ bảo quản tối đa (°C)", "required": False},
        }

    def validate_category(self, category):
        """Cho phép danh mục hệ thống hoặc danh mục riêng của NCC."""
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if not user or not category_assignable_by_user(user, category):
            raise serializers.ValidationError(
                "Danh mục không hợp lệ hoặc chưa được duyệt."
            )
        return category

    def validate_storage_duration_days(self, value):
        if value is None:
            return value
        if value <= 0 or value > MAX_STORAGE_DURATION_DAYS:
            raise serializers.ValidationError(
                f"Số ngày bảo quản phải từ 1 đến {MAX_STORAGE_DURATION_DAYS}."
            )
        return value

    def validate(self, attrs):
        """Áp dụng rule catalog + kiểm tra NCC đã duyệt."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            profile = getattr(request.user, "supplier_profile", None)
            if profile and profile.verification_status != SupplierVerificationStatus.APPROVED:
                raise serializers.ValidationError(
                    "Supplier chưa được duyệt, không thể tạo/sửa sản phẩm."
                )

        instance = self.instance
        category = attrs.get("category") or (instance.category if instance else None)#tạo mới hoặc update
        if category is None:
            raise serializers.ValidationError({"category": "Bắt buộc chọn danh mục."})

        product_master = attrs.get("product_master", serializers.empty)
        if product_master is serializers.empty:
            product_master = instance.product_master if instance else None

        name = attrs.get("name")
        if name is None and instance:
            name = instance.name
        unit = attrs.get("unit")
        if unit is None and instance:
            unit = instance.unit

        supplier = request.user.supplier_profile
        resolved = apply_supplier_product_catalog_rules(
            user=request.user,
            category=category,
            product_master=product_master,
            name=name or "",
            unit=unit or "",
            supplier=supplier,
            instance=instance,
        )
        attrs.update(resolved)
        return attrs

    def create(self, validated_data):
        """Tạo sản phẩm mới với trạng thái chờ duyệt."""
        request = self.context["request"]
        supplier = request.user.supplier_profile
        if SupplierProduct.objects.filter(supplier=supplier).count() >= get_system_settings().max_products_per_supplier:
            raise serializers.ValidationError(
                f"Mỗi nhà cung cấp tối đa {get_system_settings().max_products_per_supplier} sản phẩm."
            )
        validated_data["supplier"] = supplier
        validated_data.setdefault("status", SupplierProductStatus.PENDING)
        return super().create(validated_data)


class VerifySupplierProductSerializer(serializers.Serializer):
    """Serializer Admin duyệt hoặc từ chối sản phẩm."""

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
        help_text="Bắt buộc khi status=rejected hoặc inactive",
    )

    def validate(self, attrs):
        return require_rejection_reason(
            attrs,
            "status",
            "rejection_reason",
            {
                SupplierProductStatus.REJECTED,
                SupplierProductStatus.INACTIVE,
            },
        )


from .models import CultivationProcess  # thêm import

class CultivationProcessSerializer(serializers.ModelSerializer):
    """Serializer quản lý các bước quy trình canh tác."""

    class Meta:
        """Cấu hình trường quy trình canh tác."""

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
        """Kiểm tra quyền thao tác quy trình trên sản phẩm."""
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated and user.role == "supplier":
            profile = getattr(user, "supplier_profile", None)
            if not profile or product.supplier_id != profile.id:
                raise serializers.ValidationError(
                    "Bạn không có quyền thao tác quy trình của sản phẩm này."
                )
        return product

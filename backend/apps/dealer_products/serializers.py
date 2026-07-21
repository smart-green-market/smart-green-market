"""Serializer sản phẩm đại lý, ảnh và tồn kho."""

from rest_framework import serializers

from apps.dealers.models import DealerProfileStatus
from apps.categories.utils import category_assignable_by_user
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from common.approval_nested import ApprovalCategoryNestedSerializer, ApprovalDealerNestedSerializer
from apps.system_config.services import get_system_settings
from common.business_rules import allowed_image_extensions_label
from common.files import build_media_url
from common.openapi_enums import schema_choice_field
from common.validators import require_rejection_reason, validate_image_upload

from .canonical_inventory import (
    find_canonical_dealer_product,
    resolve_canonical_title,
    strip_title_suffix,
)
from .models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerInventoryTransactionType,
    DealerInventoryWastage,
    DealerProduct,
    DealerProductImage,
    DealerProductStatus,
)


_IMAGE_FIELD_HELP = (
    f"Ảnh sản phẩm đại lý ({allowed_image_extensions_label()} — tối đa 5MB/ảnh)"
)


class DealerProductImageSerializer(serializers.ModelSerializer):
    """Upload và cập nhật ảnh sản phẩm đại lý (multipart field `image_url`)."""

    image_url = serializers.FileField(
        required=False,
        help_text=_IMAGE_FIELD_HELP,
    )

    class Meta:
        model = DealerProductImage
        fields = [
            "id",
            "dealer_product",
            "image_url",
            "is_thumbnail",
            "sort_order",
            "created_at",
        ]
        read_only_fields = ["created_at"]
        extra_kwargs = {
            "dealer_product": {"help_text": "ID sản phẩm đại lý"},
            "is_thumbnail": {"help_text": "true = ảnh đại diện"},
            "sort_order": {"help_text": "Thứ tự hiển thị"},
        }

    def validate_image_url(self, file):
        if file and hasattr(file, "read"):
            validate_image_upload(file)
        return file

    def validate(self, attrs):
        product = attrs.get("dealer_product") or getattr(
            self.instance, "dealer_product", None
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

    def create(self, validated_data):
        image = super().create(validated_data)
        if image.is_thumbnail:
            DealerProductImage.objects.filter(
                dealer_product=image.dealer_product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)
        return image

    def update(self, instance, validated_data):
        new_file = validated_data.get("image_url")
        if new_file and instance.image_url:
            instance.image_url.delete(save=False)
        image = super().update(instance, validated_data)
        if image.is_thumbnail:
            DealerProductImage.objects.filter(
                dealer_product=image.dealer_product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)
        return image

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image_url"] = build_media_url(instance.image_url, self.context.get("request"))
        return data


class DealerProductReadSerializer(serializers.ModelSerializer):
    images = DealerProductImageSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=DealerProductStatus.choices, read_only=True)
    category = ApprovalCategoryNestedSerializer(read_only=True)
    supplier_product_name = serializers.CharField(
        source="supplier_product.name",
        read_only=True,
        help_text="Tên sản phẩm NCC gốc",
    )
    supplier_product_unit = serializers.CharField(
        source="supplier_product.unit",
        read_only=True,
        help_text="Đơn vị sản phẩm gốc",
    )
    def get_imported_quantity(self, obj):
        value = getattr(obj, "imported_quantity", 0)
        return int(value or 0)

    def get_total_quantity(self, obj):
        value = getattr(obj, "total_quantity", 0)
        return int(value or 0)

    def get_available_quantity(self, obj):
        value = getattr(obj, "available_quantity", 0)
        return int(value or 0)

    imported_quantity = serializers.SerializerMethodField(
        help_text="Tổng số lượng đã nhập (sum quantity các lô chưa xóa)",
    )
    total_quantity = serializers.SerializerMethodField(
        help_text="Tổng tồn hiện có (sum remaining_quantity các lô chưa xóa)",
    )
    available_quantity = serializers.SerializerMethodField(
        help_text="Số lượng có thể bán (lô active, còn hạn, còn tồn)",
    )
    in_stock = serializers.SerializerMethodField(
        help_text="true nếu available_quantity > 0",
    )

    def get_in_stock(self, obj):
        return getattr(obj, "available_quantity", 0) > 0

    class Meta:
        model = DealerProduct
        fields = [
            "id",
            "dealer_profile",
            "supplier_product",
            "category",
            "supplier_product_name",
            "supplier_product_unit",
            "title",
            "description",
            "retail_price",
            "thumbnail",
            "status",
            "imported_quantity",
            "total_quantity",
            "available_quantity",
            "in_stock",
            "created_at",
            "updated_at",
            "images",
        ]
        extra_kwargs = {
            "id": {"help_text": "ID sản phẩm đại lý"},
            "dealer_profile": {"help_text": "ID hồ sơ đại lý"},
            "supplier_product": {"help_text": "ID sản phẩm NCC gốc"},
            "category": {"help_text": "ID danh mục bán lẻ của đại lý (phải active)"},
            "title": {"help_text": "Tên hiển thị bán lẻ"},
            "description": {"help_text": "Mô tả bán lẻ"},
            "retail_price": {"help_text": "Giá bán lẻ (VND)"},
            "thumbnail": {"help_text": "URL ảnh đại diện (tùy chọn)"},
        }


class DealerProductListSerializer(DealerProductReadSerializer):
    dealer = ApprovalDealerNestedSerializer(source="dealer_profile", read_only=True)

    class Meta(DealerProductReadSerializer.Meta):
        fields = DealerProductReadSerializer.Meta.fields + ["dealer"]


class DealerProductWaitingStockSerializer(DealerProductListSerializer):
    """Sản phẩm có đơn buyer chờ hàng về kho — GET .../waiting-stock/."""

    waiting_stock_quantity = serializers.IntegerField(
        read_only=True,
        help_text="Tổng SL trên đơn waiting_stock chưa phân bổ lô",
    )
    waiting_stock_order_count = serializers.IntegerField(
        read_only=True,
        help_text="Số đơn buyer distinct ở trạng thái waiting_stock",
    )

    class Meta(DealerProductListSerializer.Meta):
        fields = DealerProductListSerializer.Meta.fields + [
            "waiting_stock_quantity",
            "waiting_stock_order_count",
        ]


class DealerProductDetailSerializer(DealerProductListSerializer):
    """Chi tiết sản phẩm đại lý — thêm hướng dẫn bảo quản từ NCC gốc."""

    storage_duration_days = serializers.IntegerField(
        source="supplier_product.storage_duration_days",
        read_only=True,
        allow_null=True,
        help_text="Số ngày bảo quản được",
    )
    min_storage_temp = serializers.DecimalField(
        source="supplier_product.min_storage_temp",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
        help_text="Nhiệt độ bảo quản tối thiểu (°C)",
    )
    max_storage_temp = serializers.DecimalField(
        source="supplier_product.max_storage_temp",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
        help_text="Nhiệt độ bảo quản tối đa (°C)",
    )

    class Meta(DealerProductListSerializer.Meta):
        fields = DealerProductListSerializer.Meta.fields + [
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
        ]


class DealerProductSerializer(serializers.ModelSerializer):
    images = DealerProductImageSerializer(many=True, read_only=True)
    status = schema_choice_field(choices=DealerProductStatus.choices, read_only=True)

    class Meta:
        model = DealerProduct
        fields = "__all__"
        read_only_fields = [
            "dealer_profile",
            "status",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "supplier_product": {"help_text": "ID sản phẩm NCC (phải active)"},
            "category": {"help_text": "ID danh mục bán lẻ do đại lý tạo (phải active)"},
            "title": {"help_text": "Tên hiển thị bán lẻ"},
            "description": {"help_text": "Mô tả", "required": False},
            "retail_price": {"help_text": "Giá bán lẻ (VND)"},
            "thumbnail": {"help_text": "URL ảnh đại diện", "required": False},
        }

    def validate_supplier_product(self, product):
        if product.status != SupplierProductStatus.ACTIVE:
            raise serializers.ValidationError(
                "Sản phẩm NCC chưa active, không thể đăng bán."
            )
        return product

    def validate_category(self, category):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if not user or not category_assignable_by_user(user, category):
            raise serializers.ValidationError(
                "Danh mục không hợp lệ. Chọn danh mục hệ thống hoặc danh mục riêng của bạn."
            )
        return category

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            profile = getattr(request.user, "dealer_profile", None)
            if not profile:
                raise serializers.ValidationError("Bạn cần có hồ sơ đại lý.")
            if profile.status != DealerProfileStatus.ACTIVE:
                raise serializers.ValidationError(
                    "Hồ sơ đại lý chưa active, không thể tạo/sửa sản phẩm."
                )
        if self.instance is None and not attrs.get("category"):
            raise serializers.ValidationError(
                {"category": "Bắt buộc chọn danh mục bán lẻ."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        profile = request.user.dealer_profile
        supplier_product = validated_data["supplier_product"]
        title = strip_title_suffix(
            validated_data.get("title")
            or resolve_canonical_title(supplier_product=supplier_product)
        )
        validated_data["title"] = title
        master_id = supplier_product.product_master_id
        if master_id:
            validated_data["product_master_id"] = master_id
        if find_canonical_dealer_product(
            profile,
            supplier_product=supplier_product,
            product_master_id=master_id,
            title=title,
        ):
            raise serializers.ValidationError(
                {
                    "supplier_product": (
                        "Sản phẩm catalog này đã có trong cửa hàng."
                    )
                }
            )
        validated_data["dealer_profile"] = profile
        validated_data.setdefault("status", DealerProductStatus.PENDING)
        return super().create(validated_data)


class VerifyDealerProductSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=[
            DealerProductStatus.ACTIVE,
            DealerProductStatus.REJECTED,
            DealerProductStatus.INACTIVE,
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
                DealerProductStatus.REJECTED,
                DealerProductStatus.INACTIVE,
            },
        )


class DealerInventoryBatchSerializer(serializers.ModelSerializer):
    status = schema_choice_field(
        choices=DealerInventoryBatchStatus.choices,
        read_only=True,
    )
    dealer_product_title = serializers.CharField(
        source="dealer_product.title",
        read_only=True,
    )
    order_code = serializers.CharField(
        source="purchase_order_item.purchase_order.order_code",
        read_only=True,
        allow_null=True,
    )
    category = ApprovalCategoryNestedSerializer(
        source="dealer_product.category",
        read_only=True,
        allow_null=True,
    )
    supplier_id = serializers.IntegerField(
        source="dealer_product.supplier_product.supplier_id",
        read_only=True,
    )
    supplier_name = serializers.CharField(
        source="dealer_product.supplier_product.supplier.company_name",
        read_only=True,
    )
    supplier_product = serializers.IntegerField(
        source="dealer_product.supplier_product_id",
        read_only=True,
    )
    supplier_product_name = serializers.CharField(
        source="dealer_product.supplier_product.name",
        read_only=True,
    )
    supplier_product_unit = serializers.CharField(
        source="dealer_product.supplier_product.unit",
        read_only=True,
    )
    storage_duration_days = serializers.IntegerField(
        source="dealer_product.supplier_product.storage_duration_days",
        read_only=True,
        allow_null=True,
    )
    min_storage_temp = serializers.DecimalField(
        source="dealer_product.supplier_product.min_storage_temp",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    max_storage_temp = serializers.DecimalField(
        source="dealer_product.supplier_product.max_storage_temp",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = DealerInventoryBatch
        fields = [
            "id",
            "dealer_product",
            "dealer_product_title",
            "category",
            "purchase_order_item",
            "order_code",
            "supplier_id",
            "supplier_name",
            "supplier_product",
            "supplier_product_name",
            "supplier_product_unit",
            "batch_number",
            "quantity",
            "remaining_quantity",
            "import_price",
            "import_date",
            "production_date",
            "expiry_date",
            "manual_sale_price",
            "storage_duration_days",
            "min_storage_temp",
            "max_storage_temp",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        from .age_discount import batch_price_to_dict, compute_batch_effective_price

        cache = self.context.get("age_discount_policies_cache") or {}
        dealer_id = instance.dealer_product.dealer_profile_id
        policies = cache.get(dealer_id)
        price = compute_batch_effective_price(instance, policies=policies)

        data = super().to_representation(instance)
        data.update(batch_price_to_dict(price))
        return data


class DealerInventoryTransactionSerializer(serializers.ModelSerializer):
    type = schema_choice_field(
        choices=DealerInventoryTransactionType.choices,
        read_only=True,
    )
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = DealerInventoryTransaction
        fields = [
            "id",
            "batch",
            "batch_number",
            "type",
            "quantity_before",
            "quantity_change",
            "quantity_after",
            "reason",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = fields


class DealerInventoryWastageSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = DealerInventoryWastage
        fields = [
            "id",
            "batch",
            "quantity",
            "reason",
            "note",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]


class RecordWastageSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, help_text="Số lượng hao hụt")
    reason = serializers.CharField(max_length=255, help_text="Lý do hao hụt")
    note = serializers.CharField(required=False, allow_blank=True, default="")


class SetBatchExpiryDateSerializer(serializers.Serializer):
    expiry_date = serializers.DateField(
        help_text="Ngày hết hạn lô (YYYY-MM-DD), phải >= ngày nhập kho",
    )


class BackfillExpiryDatesSerializer(serializers.Serializer):
    default_storage_days = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=3650,
        help_text=(
            "Số ngày bảo quản mặc định khi SP NCC chưa có hoặc có giá trị placeholder "
            "(vd. 2147483647). Rau xanh thường 3–7 ngày."
        ),
    )
    fix_supplier_products = serializers.BooleanField(
        required=False,
        default=False,
        help_text=(
            "Nếu true: cập nhật storage_duration_days trên SP NCC sang default_storage_days "
            "trước khi backfill (cần truyền default_storage_days)."
        ),
    )

    def validate(self, attrs):
        if attrs.get("fix_supplier_products") and attrs.get("default_storage_days") is None:
            raise serializers.ValidationError(
                {
                    "default_storage_days": (
                        "Bắt buộc khi fix_supplier_products=true."
                    )
                }
            )
        return attrs

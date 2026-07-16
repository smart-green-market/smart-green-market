"""API ViewSet quản lý sản phẩm, ảnh sản phẩm và quy trình canh tác."""

from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.openapi_files import MULTIPART_FILE_UPLOAD_NOTE, multipart_request
from common.verify_openapi import (
    SUPPLIER_PRODUCT_VERIFY_APPROVE,
    SUPPLIER_PRODUCT_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from apps.accounts.models import AccountRole
from common.permission import IsAdmin, IsActive, IsAdminOrSupplierProfile, IsDealer, IsSupplier
from common.pagination import LoadMorePagination
from common.status_counts import build_count_status, filter_by_status_param
from common.querysets import (
    ORDER_CULTIVATION,
    ORDER_IMAGE,
    ORDER_UPDATED,
    filter_admin_or_supplier_account,
    filter_supplier_products_for_dealer,
)
from common.soft_delete import default_exclude_deleted
from .archive import soft_delete_supplier_product
from .order_demand import annotate_supplier_product_order_demand, purchase_order_items_for_product
from .models import SupplierProduct, SupplierProductImage, CultivationProcess, SupplierProductStatus
from .openapi import SupplierProductImageBulkUploadForm, SupplierProductImageReplaceForm
from .serializer import (
    SupplierProductDetailSerializer,
    SupplierProductListSerializer,
    SupplierProductSerializer,
    SupplierProductImageSerializer,
    SupplierProductImageBulkUploadSerializer,
    CultivationProcessSerializer,
    VerifySupplierProductSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Products"],
        summary="Danh sách sản phẩm",
        description=(
            "Admin: tất cả. Supplier: sản phẩm của mình.\n"
            "Supplier/Admin: mỗi sản phẩm kèm `pending_order_quantity` (SL chờ NCC duyệt) "
            "và `preparation_quantity` (SL cần chuẩn bị).\n"
            "Dealer chọn SP để đặt hàng: ưu tiên "
            "`GET /api/suppliers/{supplier_id}/products/` (theo từng NCC).\n"
            "Endpoint này: catalog tổng hoặc lọc `?supplier_id=` (tùy chọn)."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter(
                name="supplier_id",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Dealer: lọc sản phẩm theo NCC (ID từ GET /api/suppliers/)",
            ),
            OpenApiParameter(
                name="category",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Lọc sản phẩm theo danh mục",
            ),
            OpenApiParameter("search", str, description="Tìm kiếm theo tên sản phẩm, công ty nhà cung cấp, danh mục, hoặc sản phẩm chuẩn", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái (pending, active, inactive, rejected)", required=False),
        ],
        responses={
            200: paginated_response_schema(
                SupplierProductListSerializer,
                "PaginatedSupplierProduct",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Supplier Products"],
        summary="Chi tiết sản phẩm",
        description=(
            "Supplier/Admin: kèm `pending_order_quantity`, `preparation_quantity` "
            "và `purchase_orders[]` — phiếu nhập đại lý theo mặt hàng."
        ),
        responses={200: SupplierProductDetailSerializer},
    ),
    create=extend_schema(
        tags=["Supplier Products"],
        summary="Tạo sản phẩm mới",
        description=(
            "### Trường hợp 1 — Danh mục hệ thống\n"
            "1. `GET /api/product-masters/?category_id=` — chọn sản phẩm chuẩn\n"
            "2. Gửi `category` (system) + `product_master` + giá/ảnh/mô tả\n"
            "3. **Không** gửi `name`/`unit` — backend lấy từ master\n\n"
            "### Trường hợp 2 — Danh mục riêng\n"
            "1. Gửi `category` (custom) + `name` + `unit` + giá/ảnh/mô tả\n"
            "2. `product_master` **tuỳ chọn** (link catalog để thống kê/so sánh giá)\n"
            "3. Dealer catalog hiển thị **`name`** NCC\n\n"
            "**Dropdown master trống?** Dùng trường hợp 2 — admin tự thêm master qua "
            "`POST /api/product-masters/` khi cần chuẩn hóa.\n\n"
            "`daily_production_capacity` = năng lực SX/ngày — **không phải tồn kho**."
        ),
        examples=[
            OpenApiExample(
                "Trường hợp 1 — danh mục system + Product Master",
                value={
                    "category": 1,
                    "product_master": 5,
                    "wholesale_price": "20000.00",
                    "daily_production_capacity": "100.00",
                    "description": "Cà chua nhà kính",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Trường hợp 2 — danh mục riêng + tên tự do",
                value={
                    "category": 12,
                    "name": "Cà chua bi nhà kính loại A",
                    "unit": "kg",
                    "product_master": 5,
                    "wholesale_price": "35000.00",
                    "daily_production_capacity": "50.00",
                    "description": "Giống cherry",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(tags=["Supplier Products"], summary="Cập nhật sản phẩm"),
    partial_update=extend_schema(tags=["Supplier Products"], summary="Cập nhật một phần"),
    destroy=extend_schema(
        tags=["Supplier Products"],
        summary="Xóa mềm sản phẩm",
        description=(
            "Đặt `status=deleted` (không xóa cứng DB). "
            "Chặn khi còn phiếu nhập đang xử lý hoặc đại lý đang bán. "
            "Admin hoặc NCC sở hữu sản phẩm."
        ),
    ),
)
class SupplierProductViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD và duyệt sản phẩm nhà cung cấp."""

    permission_classes = [IsActive]
    queryset = SupplierProduct.objects.select_related(
        "supplier",
        "supplier__account",
        "category",
        "verified_by",
    ).prefetch_related("images")
    serializer_class = SupplierProductSerializer

    def get_serializer_class(self):
        """Trả về serializer phù hợp theo action hiện tại."""
        if self.action == "retrieve":
            return SupplierProductDetailSerializer
        if self.action in ("list", "verify"):
            return SupplierProductListSerializer
        return SupplierProductSerializer

    def _should_annotate_order_demand(self):
        user = self.request.user
        return (
            user.is_authenticated
            and user.role in (AccountRole.ADMIN, AccountRole.SUPPLIER)
            and self.action in ("list", "retrieve")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == "retrieve" and self._should_annotate_order_demand():
            product = getattr(self, "_retrieve_product", None)
            if product is not None:
                context["purchase_order_items"] = list(
                    purchase_order_items_for_product(product)
                )
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self._retrieve_product = instance
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_permissions(self):
        """Chỉ Admin được duyệt sản phẩm; dealer chỉ đọc catalog."""
        if self.action == "verify":
            return [IsAdmin()]
        if (
            self.request.user.is_authenticated
            and self.request.user.role == AccountRole.DEALER
        ):
            if self.action in ("list", "retrieve"):
                return [IsDealer(), IsActive()]
            return [IsAdmin()]
        if self.action in ("create", "update", "partial_update"):
            return [IsSupplier(), IsActive()]
        if self.action == "destroy":
            return [IsActive(), IsAdminOrSupplierProfile()]
        return [IsActive()]

    def _apply_supplier_product_list_filters(self, qs, request, *, apply_status=True):
        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(supplier__company_name__icontains=search)
                | Q(category__name__icontains=search)
                | Q(product_master__name__icontains=search)
            )
            
        category_id = request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)
            
        if apply_status:
            qs = filter_by_status_param(
                qs, request.query_params.get("status"), field="status"
            )
        return qs

    def list(self, request, *args, **kwargs):
        base_qs = self._apply_supplier_product_list_filters(
            self.filter_queryset(self.get_queryset()),
            request,
            apply_status=False,
        )
        count_status = build_count_status(
            base_qs, field="status", choices=SupplierProductStatus
        )
        qs = filter_by_status_param(
            base_qs, request.query_params.get("status"), field="status"
        )
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(
            serializer.data, count_status=count_status
        )

    def get_queryset(self):
        """Lọc sản phẩm theo quyền Admin, NCC hoặc catalog đại lý."""
        user = self.request.user
        if user.role == AccountRole.DEALER:
            if self.action in ("list", "retrieve"):
                supplier_id = self.request.query_params.get("supplier_id")
                if supplier_id:
                    try:
                        supplier_id = int(supplier_id)
                    except (TypeError, ValueError) as exc:
                        raise ValidationError(
                            {"supplier_id": "supplier_id phải là số nguyên."}
                        ) from exc
                qs = filter_supplier_products_for_dealer(
                    self.queryset,
                    supplier_id=supplier_id,
                    ordering=ORDER_UPDATED,
                )
            else:
                qs = SupplierProduct.objects.none()
        else:
            qs = filter_admin_or_supplier_account(
                self.queryset,
                user,
                ordering=ORDER_UPDATED,
                pending_field="status",
            )
            if self.action == "list":
                qs = default_exclude_deleted(
                    qs,
                    self.request,
                    status_field="status",
                    deleted_value=SupplierProductStatus.DELETED,
                )

        if self._should_annotate_order_demand():
            qs = annotate_supplier_product_order_demand(qs)
        return qs

    def perform_destroy(self, instance):
        soft_delete_supplier_product(instance, self.request.user)

    def perform_create(self, serializer):
        """Lưu sản phẩm mới và gửi thông báo cho Admin."""
        product = serializer.save()
        notify_admins(
            title="[Sản phẩm] Có sản phẩm mới chờ duyệt",
            content=(
                f"Sản phẩm {product.name} của {product.supplier.company_name} "
                f"cần được duyệt."
            ),
            reference_type="supplier_product",
            reference_id=product.id,
            created_by=self.request.user,
        )

    @extend_schema(
        tags=["Supplier Products"],
        summary="Admin duyệt / từ chối sản phẩm",
        description=(
            "`rejected` / `inactive` bắt buộc `rejection_reason`."
            + VERIFY_REJECT_HELP
        ),
        request=VerifySupplierProductSerializer,
        responses={200: SupplierProductListSerializer},
        examples=[SUPPLIER_PRODUCT_VERIFY_APPROVE, SUPPLIER_PRODUCT_VERIFY_REJECT],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Admin duyệt hoặc từ chối sản phẩm và thông báo nhà cung cấp."""
        product = self.get_object()
        serializer = VerifySupplierProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product.status = serializer.validated_data["status"]
        product.rejection_reason = serializer.validated_data.get("rejection_reason", "")
        product.verified_by = request.user
        product.verified_at = timezone.now()
        product.save()

        approved = product.status == SupplierProductStatus.ACTIVE
        notify_account(
            account=product.supplier.account,
            title=f"[Sản phẩm] \"{product.name}\" — {'Đã duyệt' if approved else 'Từ chối'}",
            content=(
                f"Sản phẩm {product.name} "
                f"{'đã được duyệt' if approved else 'đã bị từ chối'}."
                + (
                    f" Lý do: {product.rejection_reason}"
                    if product.rejection_reason
                    else ""
                )
            ),
            reference_type="supplier_product",
            reference_id=product.id,
            created_by=request.user,
            notif_type="success" if approved else "error",
        )
        return Response(
            SupplierProductListSerializer(product, context={"request": request}).data
        )


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Product Images"],
        summary="Danh sách ảnh sản phẩm",
        description=(
            "Admin xem tất cả. Supplier/Dealer chỉ thấy ảnh sản phẩm của mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                SupplierProductImageSerializer,
                "PaginatedSupplierProductImage",
            )
        },
    ),
    retrieve=extend_schema(tags=["Supplier Product Images"], summary="Chi tiết ảnh"),
    create=extend_schema(
        tags=["Supplier Product Images"],
        summary="Upload ảnh sản phẩm",
        description=(
            f"{MULTIPART_FILE_UPLOAD_NOTE}\n\n"
            "Field `images` — chọn một hoặc nhiều file.\n"
            "- `is_thumbnail=true`: ảnh đầu tiên làm ảnh đại diện"
        ),
        request=multipart_request(SupplierProductImageBulkUploadForm),
        responses={201: SupplierProductImageSerializer(many=True)},
    ),
    update=extend_schema(
        tags=["Supplier Product Images"],
        summary="Thay ảnh sản phẩm",
        description=f"{MULTIPART_FILE_UPLOAD_NOTE}\n\nChọn file ảnh mới qua field `image_url`.",
        request=multipart_request(SupplierProductImageReplaceForm),
        responses={200: SupplierProductImageSerializer},
    ),
    partial_update=extend_schema(
        tags=["Supplier Product Images"],
        summary="Cập nhật một phần (ảnh / thumbnail / thứ tự)",
        description=f"{MULTIPART_FILE_UPLOAD_NOTE}\n\nCó thể chọn file mới qua field `image_url`.",
        request=multipart_request(SupplierProductImageReplaceForm),
        responses={200: SupplierProductImageSerializer},
    ),
    destroy=extend_schema(tags=["Supplier Product Images"], summary="Xóa ảnh"),
)
class SupplierProductImageViewSet(viewsets.ModelViewSet):
    """ViewSet upload và quản lý ảnh sản phẩm."""

    permission_classes = [IsActive]
    parser_classes = [MultiPartParser, FormParser]
    queryset = SupplierProductImage.objects.select_related(
        "supplier_product__supplier"
    )
    serializer_class = SupplierProductImageSerializer

    def get_serializer_class(self):
        """Dùng serializer bulk upload khi tạo nhiều ảnh."""
        if self.action == "create":
            return SupplierProductImageBulkUploadSerializer
        return SupplierProductImageSerializer

    def create(self, request, *args, **kwargs):
        """Upload một hoặc nhiều ảnh sản phẩm."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        images = serializer.save()
        return Response(
            SupplierProductImageSerializer(
                images,
                many=True,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def get_queryset(self):
        """Lọc ảnh theo quyền Admin hoặc nhà cung cấp sở hữu sản phẩm."""
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            account_lookup="supplier_product__supplier__account",
            ordering=ORDER_IMAGE,
        )


@extend_schema_view(
    list=extend_schema(
        tags=["Cultivation Processes"],
        summary="Danh sách quy trình canh tác",
        description=(
            "Admin xem tất cả. Supplier/Dealer chỉ thấy quy trình sản phẩm của mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                CultivationProcessSerializer,
                "PaginatedCultivationProcess",
            )
        },
    ),
    retrieve=extend_schema(tags=["Cultivation Processes"], summary="Chi tiết bước quy trình"),
    create=extend_schema(tags=["Cultivation Processes"], summary="Thêm bước quy trình"),
    update=extend_schema(tags=["Cultivation Processes"], summary="Cập nhật bước"),
    partial_update=extend_schema(tags=["Cultivation Processes"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Cultivation Processes"], summary="Xóa bước quy trình"),
)
class CultivationProcessViewSet(viewsets.ModelViewSet):
    """ViewSet quản lý các bước quy trình canh tác sản phẩm."""

    permission_classes = [IsActive]
    queryset = CultivationProcess.objects.select_related(
        "supplier_product__supplier"
    )
    serializer_class = CultivationProcessSerializer

    def get_queryset(self):
        """Lọc quy trình theo quyền Admin hoặc nhà cung cấp sở hữu sản phẩm."""
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            account_lookup="supplier_product__supplier__account",
            ordering=ORDER_CULTIVATION,
        )

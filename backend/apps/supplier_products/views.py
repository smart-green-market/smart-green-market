from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.permission import IsAdmin, IsActive
from common.querysets import (
    ORDER_CULTIVATION,
    ORDER_IMAGE,
    ORDER_UPDATED,
    filter_admin_or_supplier_account,
)
from .models import SupplierProduct, SupplierProductImage, CultivationProcess, SupplierProductStatus
from .openapi import SupplierProductImageBulkUploadForm, SupplierProductImageReplaceForm
from .serializer import (
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
            "Admin xem tất cả. Supplier/Dealer chỉ thấy sản phẩm của mình."
            + PAGINATION_QUERY_HELP
        ),
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
        responses={200: SupplierProductListSerializer},
    ),
    create=extend_schema(tags=["Supplier Products"], summary="Tạo sản phẩm mới"),
    update=extend_schema(tags=["Supplier Products"], summary="Cập nhật sản phẩm"),
    partial_update=extend_schema(tags=["Supplier Products"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Supplier Products"], summary="Xóa sản phẩm"),
)
class SupplierProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    queryset = SupplierProduct.objects.select_related(
        "supplier",
        "supplier__account",
        "category",
        "verified_by",
    ).prefetch_related("images")
    serializer_class = SupplierProductSerializer

    def get_serializer_class(self):
        if self.action in ("list", "retrieve", "verify"):
            return SupplierProductListSerializer
        return SupplierProductSerializer

    def get_permissions(self):
        if self.action == "verify":
            return [IsAdmin()]
        return [IsActive()]

    def get_queryset(self):
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            ordering=ORDER_UPDATED,
            pending_field="status",
        )

    def perform_create(self, serializer):
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
        request=VerifySupplierProductSerializer,
        responses={200: SupplierProductListSerializer},
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
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
            "Chọn ảnh trên Swagger (multipart/form-data, field `images`).\n"
            "Có thể chọn nhiều file cùng lúc.\n"
            "- `is_thumbnail=true`: ảnh đầu tiên làm ảnh đại diện\n"
            f"- Định dạng: jpg, jpeg, png, webp, gif, bmp, tif, avif, heic... — tối đa 5MB/ảnh"
        ),
        request={"multipart/form-data": SupplierProductImageBulkUploadForm},
        responses={201: SupplierProductImageSerializer(many=True)},
    ),
    update=extend_schema(
        tags=["Supplier Product Images"],
        summary="Thay ảnh sản phẩm",
        description="Chọn ảnh mới qua field `image_url` (multipart/form-data).",
        request={"multipart/form-data": SupplierProductImageReplaceForm},
        responses={200: SupplierProductImageSerializer},
    ),
    partial_update=extend_schema(
        tags=["Supplier Product Images"],
        summary="Cập nhật một phần (ảnh / thumbnail / thứ tự)",
        description="Có thể upload ảnh mới qua field `image_url` (multipart/form-data).",
        request={"multipart/form-data": SupplierProductImageReplaceForm},
        responses={200: SupplierProductImageSerializer},
    ),
    destroy=extend_schema(tags=["Supplier Product Images"], summary="Xóa ảnh"),
)
class SupplierProductImageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    parser_classes = [MultiPartParser, FormParser]
    queryset = SupplierProductImage.objects.select_related(
        "supplier_product__supplier"
    )
    serializer_class = SupplierProductImageSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return SupplierProductImageBulkUploadSerializer
        return SupplierProductImageSerializer

    def create(self, request, *args, **kwargs):
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
    permission_classes = [IsActive]
    queryset = CultivationProcess.objects.select_related(
        "supplier_product__supplier"
    )
    serializer_class = CultivationProcessSerializer

    def get_queryset(self):
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            account_lookup="supplier_product__supplier__account",
            ordering=ORDER_CULTIVATION,
        )

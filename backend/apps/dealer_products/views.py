"""API sản phẩm đại lý, ảnh và tồn kho."""

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from django.db.models import Q

from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.openapi_files import multipart_request
from common.verify_openapi import (
    DEALER_PRODUCT_VERIFY_APPROVE,
    DEALER_PRODUCT_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.permission import IsActive, IsAdmin, IsAdminOrDealer, IsDealer
from common.querysets import ORDER_IMAGE, ORDER_NEWEST, ORDER_UPDATED, filter_admin_or_dealer_account
from common.pagination import LoadMorePagination
from common.status_counts import build_count_status, filter_by_status_param

from .models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerInventoryTransaction,
    DealerProduct,
    DealerProductImage,
    DealerProductStatus,
)
from .openapi import (
    DEALER_PRODUCT_IMAGE_HELP,
    DealerProductImageCreateForm,
    DealerProductImageUpdateForm,
)
from .serializers import (
    DealerInventoryBatchSerializer,
    DealerInventoryTransactionSerializer,
    DealerInventoryWastageSerializer,
    DealerProductDetailSerializer,
    DealerProductImageSerializer,
    DealerProductListSerializer,
    DealerProductSerializer,
    RecordWastageSerializer,
    VerifyDealerProductSerializer,
)
from .services import annotate_dealer_product_stock, record_wastage


def _filter_dealer_product_scope(qs, user):
    return filter_admin_or_dealer_account(
        qs,
        user,
        account_lookup="dealer_profile__account",
        ordering=ORDER_UPDATED,
        pending_field="status",
    )


def _filter_inventory_scope(qs, user):
    return filter_admin_or_dealer_account(
        qs,
        user,
        account_lookup="dealer_product__dealer_profile__account",
        ordering=ORDER_NEWEST,
        pending_field="status",
    )


@extend_schema_view(
    list=extend_schema(
        tags=["Dealer Products"],
        summary="Danh sách sản phẩm đại lý",
        description="Admin xem tất cả. Dealer chỉ thấy sản phẩm của mình."
        + PAGINATION_QUERY_HELP,
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo tên sản phẩm, danh mục, nhà cung cấp", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái", required=False),
        ],
        responses={
            200: paginated_response_schema(
                DealerProductListSerializer,
                "PaginatedDealerProduct",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Dealer Products"],
        summary="Chi tiết sản phẩm đại lý",
        responses={200: DealerProductDetailSerializer},
    ),
    create=extend_schema(tags=["Dealer Products"], summary="Đăng sản phẩm bán lẻ"),
    update=extend_schema(tags=["Dealer Products"], summary="Cập nhật sản phẩm"),
    partial_update=extend_schema(tags=["Dealer Products"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Dealer Products"], summary="Xóa sản phẩm"),
)
class DealerProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    queryset = DealerProduct.objects.select_related(
        "dealer_profile",
        "dealer_profile__account",
        "supplier_product",
        "category",
    ).prefetch_related("images")
    serializer_class = DealerProductSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DealerProductDetailSerializer
        if self.action in ("list", "verify"):
            return DealerProductListSerializer
        return DealerProductSerializer

    def get_permissions(self):
        if self.action == "verify":
            return [IsAdmin()]
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsActive(), IsDealer()]
        return [IsActive()]

    def get_queryset(self):
        qs = _filter_dealer_product_scope(self.queryset, self.request.user)
        if self.action in ("list", "retrieve", "verify"):
            qs = annotate_dealer_product_stock(qs)
        return qs

    def _apply_dealer_product_list_filters(self, qs, request, *, apply_status=True):
        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(category__name__icontains=search)
                | Q(supplier_product__supplier__company_name__icontains=search)
            )
        if apply_status:
            qs = filter_by_status_param(
                qs, request.query_params.get("status"), field="status"
            )
        return qs

    def list(self, request, *args, **kwargs):
        base_qs = self._apply_dealer_product_list_filters(
            self.filter_queryset(self.get_queryset()),
            request,
            apply_status=False,
        )
        count_status = build_count_status(
            base_qs, field="status", choices=DealerProductStatus
        )
        qs = filter_by_status_param(base_qs, request.query_params.get("status"), field="status")
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data, count_status=count_status)

    def perform_create(self, serializer):
        product = serializer.save()
        notify_admins(
            title="[Sản phẩm đại lý] Có sản phẩm mới chờ duyệt",
            content=(
                f"Sản phẩm {product.title} của {product.dealer_profile.store_name} "
                f"cần được duyệt."
            ),
            reference_type="dealer_product",
            reference_id=product.id,
            created_by=self.request.user,
        )

    @extend_schema(
        tags=["Dealer Products"],
        summary="Admin duyệt / từ chối sản phẩm đại lý",
        description=(
            "`rejected` / `inactive` bắt buộc `rejection_reason`."
            + VERIFY_REJECT_HELP
        ),
        request=VerifyDealerProductSerializer,
        responses={200: DealerProductListSerializer},
        examples=[DEALER_PRODUCT_VERIFY_APPROVE, DEALER_PRODUCT_VERIFY_REJECT],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        product = self.get_object()
        serializer = VerifyDealerProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product.status = serializer.validated_data["status"]
        product.save(update_fields=["status", "updated_at"])
        rejection_reason = serializer.validated_data.get("rejection_reason", "")

        status_labels = {
            DealerProductStatus.ACTIVE: "đã được duyệt",
            DealerProductStatus.REJECTED: "bị từ chối",
            DealerProductStatus.INACTIVE: "bị khóa",
        }
        content = (
            f"Sản phẩm {product.title} "
            f"{status_labels.get(product.status, 'đã cập nhật')}."
        )
        if rejection_reason:
            content = f"{content} Lý do: {rejection_reason}"
        notify_account(
            account=product.dealer_profile.account,
            title=f"[Sản phẩm] {product.title}",
            content=content,
            reference_type="dealer_product",
            reference_id=product.id,
            created_by=request.user,
            notif_type="success" if product.status == DealerProductStatus.ACTIVE else "warning",
        )
        return Response(DealerProductListSerializer(product, context={"request": request}).data)


@extend_schema_view(
    list=extend_schema(tags=["Dealer Product Images"], summary="Danh sách ảnh"),
    retrieve=extend_schema(tags=["Dealer Product Images"], summary="Chi tiết ảnh"),
    create=extend_schema(
        tags=["Dealer Product Images"],
        summary="Thêm ảnh sản phẩm",
        description=DEALER_PRODUCT_IMAGE_HELP,
        request=multipart_request(DealerProductImageCreateForm),
        responses={201: DealerProductImageSerializer},
    ),
    update=extend_schema(
        tags=["Dealer Product Images"],
        summary="Cập nhật ảnh",
        description=DEALER_PRODUCT_IMAGE_HELP,
        request=multipart_request(DealerProductImageUpdateForm),
        responses={200: DealerProductImageSerializer},
    ),
    partial_update=extend_schema(
        tags=["Dealer Product Images"],
        summary="Cập nhật một phần",
        description=DEALER_PRODUCT_IMAGE_HELP,
        request=multipart_request(DealerProductImageUpdateForm),
        responses={200: DealerProductImageSerializer},
    ),
    destroy=extend_schema(tags=["Dealer Product Images"], summary="Xóa ảnh"),
)
class DealerProductImageViewSet(viewsets.ModelViewSet):
    queryset = DealerProductImage.objects.select_related(
        "dealer_product",
        "dealer_product__dealer_profile",
    )
    serializer_class = DealerProductImageSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAdminOrDealer()]
        return [IsActive(), IsDealer()]

    def get_queryset(self):
        return filter_admin_or_dealer_account(
            self.queryset,
            self.request.user,
            account_lookup="dealer_product__dealer_profile__account",
            ordering=ORDER_IMAGE,
        )

    def perform_create(self, serializer):
        product = serializer.validated_data["dealer_product"]
        if product.dealer_profile.account_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Không có quyền thêm ảnh cho sản phẩm này.")
        serializer.save()


@extend_schema_view(
    list=extend_schema(
        tags=["Dealer Inventory"],
        summary="Danh sách lô tồn kho",
        description="Lô hàng nhập từ phiếu nhập hoàn tất. Hỗ trợ tìm kiếm và lọc. " + PAGINATION_QUERY_HELP,
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo mã lô, tên nông sản, danh mục hoặc nhà cung cấp", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái lô hàng", required=False),
        ],
        responses={
            200: paginated_response_schema(
                DealerInventoryBatchSerializer,
                "PaginatedDealerInventoryBatch",
            )
        },
    ),
    retrieve=extend_schema(tags=["Dealer Inventory"], summary="Chi tiết lô tồn"),
)
class DealerInventoryBatchViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminOrDealer]
    queryset = DealerInventoryBatch.objects.select_related(
        "dealer_product",
        "dealer_product__category",
        "dealer_product__dealer_profile",
        "dealer_product__supplier_product",
        "dealer_product__supplier_product__supplier",
        "purchase_order_item",
        "purchase_order_item__purchase_order",
    ).filter(deleted_at__isnull=True)
    serializer_class = DealerInventoryBatchSerializer

    def get_queryset(self):
        return _filter_inventory_scope(self.queryset, self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(batch_number__icontains=search)
                | Q(dealer_product__title__icontains=search)
                | Q(dealer_product__category__name__icontains=search)
                | Q(dealer_product__supplier_product__supplier__company_name__icontains=search)
            )

        dp_id = request.query_params.get("dealer_product", "").strip()
        if dp_id.isdigit():
            qs = qs.filter(dealer_product_id=dp_id)

        count_status = build_count_status(
            qs, field="status", choices=DealerInventoryBatchStatus
        )

        status_param = request.query_params.get("status", "").strip()
        qs = filter_by_status_param(qs, status_param, field="status")

        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = self.get_serializer(page, many=True).data
        return paginator.get_paginated_response(data, count_status=count_status)

    @extend_schema(
        tags=["Dealer Inventory"],
        summary="Ghi nhận hao hụt tồn kho",
        request=RecordWastageSerializer,
        responses={201: DealerInventoryWastageSerializer},
    )
    @action(detail=True, methods=["post"], url_path="record-wastage")
    def record_wastage_action(self, request, pk=None):
        batch = self.get_object()
        if (
            request.user.role != "admin"
            and batch.dealer_product.dealer_profile.account_id != request.user.id
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Không có quyền trên lô tồn này.")
        serializer = RecordWastageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        wastage = record_wastage(
            batch=batch,
            quantity=serializer.validated_data["quantity"],
            reason=serializer.validated_data["reason"],
            note=serializer.validated_data.get("note", ""),
            user=request.user,
        )
        return Response(
            DealerInventoryWastageSerializer(wastage, context={"request": request}).data,
            status=201,
        )


@extend_schema_view(
    list=extend_schema(
        tags=["Dealer Inventory"],
        summary="Lịch sử biến động tồn kho",
        description="Lịch sử biến động tồn kho. Hỗ trợ tìm kiếm và lọc. " + PAGINATION_QUERY_HELP,
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo lý do", required=False),
            OpenApiParameter("batch", int, description="Lọc theo ID lô hàng", required=False),
        ],
        responses={
            200: paginated_response_schema(
                DealerInventoryTransactionSerializer,
                "PaginatedDealerInventoryTransaction",
            )
        },
    ),
    retrieve=extend_schema(tags=["Dealer Inventory"], summary="Chi tiết giao dịch tồn"),
)
class DealerInventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminOrDealer]
    queryset = DealerInventoryTransaction.objects.select_related(
        "batch",
        "batch__dealer_product",
        "batch__dealer_product__dealer_profile",
        "created_by",
    )
    serializer_class = DealerInventoryTransactionSerializer

    def get_queryset(self):
        return filter_admin_or_dealer_account(
            self.queryset,
            self.request.user,
            account_lookup="batch__dealer_product__dealer_profile__account",
            ordering=ORDER_NEWEST,
        )

    def list(self, request, *args, **kwargs):
        from common.pagination import LoadMorePagination
        
        qs = self.get_queryset()
        
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(reason__icontains=search)
            
        batch_id = request.query_params.get("batch", "").strip()
        if batch_id.isdigit():
            qs = qs.filter(batch_id=batch_id)
            
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = self.get_serializer(page, many=True).data
        return paginator.get_paginated_response(data)

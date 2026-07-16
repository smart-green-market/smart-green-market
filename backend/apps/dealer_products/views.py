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

from common.soft_delete import default_exclude_deleted
from .inventory_queries import get_warehouse_inventory_batches_qs
from .archive import soft_delete_dealer_product
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
    BackfillExpiryDatesSerializer,
    SetBatchExpiryDateSerializer,
    VerifyDealerProductSerializer,
)
from .age_discount import build_policies_cache_for_batches
from .age_discount_serializers import SetBatchSalePriceSerializer
from .inventory_expiry import (
    backfill_batch_expiry_dates,
    mark_expired_inventory_batches,
    recompute_batch_expiry_date,
    set_batch_expiry_date,
)
from .services import annotate_dealer_product_stock, record_wastage


def _annotated_dealer_product(pk):
    """Lấy sản phẩm kèm imported/total/available quantity."""
    return annotate_dealer_product_stock(
        DealerProduct.objects.select_related(
            "dealer_profile",
            "dealer_profile__account",
            "supplier_product",
            "category",
        ).prefetch_related("images").filter(pk=pk)
    ).first()


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
    destroy=extend_schema(
        tags=["Dealer Products"],
        summary="Xóa mềm sản phẩm",
        description=(
            "Đặt `status=deleted`. Chặn khi còn đơn buyer chưa kết thúc hoặc tồn kho > 0. "
            "Admin hoặc đại lý sở hữu."
        ),
    ),
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
        if self.action in ("create", "update", "partial_update"):
            return [IsActive(), IsDealer()]
        if self.action == "destroy":
            return [IsActive(), IsAdminOrDealer()]
        return [IsActive()]

    def get_queryset(self):
        qs = _filter_dealer_product_scope(self.queryset, self.request.user)
        if self.action != "create":
            qs = annotate_dealer_product_stock(qs)
        return qs

    def _detail_response(self, product):
        annotated = _annotated_dealer_product(product.pk) or product
        serializer_class = (
            DealerProductDetailSerializer
            if self.action in ("retrieve", "update", "partial_update", "create")
            else DealerProductListSerializer
        )
        return serializer_class(annotated, context={"request": self.request}).data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(self._detail_response(serializer.instance), status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(self._detail_response(serializer.instance))

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return Response(self._detail_response(self.get_object()))

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
        base_qs = default_exclude_deleted(
            base_qs,
            request,
            status_field="status",
            deleted_value=DealerProductStatus.DELETED,
        )
        count_status = build_count_status(
            base_qs, field="status", choices=DealerProductStatus
        )
        qs = filter_by_status_param(base_qs, request.query_params.get("status"), field="status")
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data, count_status=count_status)

    def perform_destroy(self, instance):
        soft_delete_dealer_product(instance, self.request.user)

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
        return Response(
            DealerProductListSerializer(
                _annotated_dealer_product(product.pk) or product,
                context={"request": request},
            ).data
        )


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
        description=(
            "Lô hàng nhập từ phiếu nhập hoàn tất. "
            "`expiry_date` = ngày nhập + `storage_duration_days` của SP NCC (nếu có). "
            "Cập nhật: `POST .../set-expiry-date/`, `POST .../recompute-expiry-date/`, "
            "`POST .../backfill-expiry-dates/`. "
            "Lô quá hạn tự chuyển `expired` khi gọi API. "
            + PAGINATION_QUERY_HELP
        ),
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
        qs = _filter_inventory_scope(self.queryset, self.request.user)
        return qs.exclude(dealer_product__status=DealerProductStatus.DELETED)

    def list(self, request, *args, **kwargs):
        dealer_id = getattr(getattr(request.user, "dealer_profile", None), "id", None)
        if request.user.role == "admin":
            dealer_id = None
        mark_expired_inventory_batches(dealer_profile_id=dealer_id)

        qs = get_warehouse_inventory_batches_qs(self.get_queryset())

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
        policies_cache = build_policies_cache_for_batches(page) if page else {}
        data = self.get_serializer(
            page,
            many=True,
            context={**self.get_serializer_context(), "age_discount_policies_cache": policies_cache},
        ).data
        return paginator.get_paginated_response(data, count_status=count_status)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        policies_cache = build_policies_cache_for_batches([instance])
        serializer = self.get_serializer(
            instance,
            context={**self.get_serializer_context(), "age_discount_policies_cache": policies_cache},
        )
        return Response(serializer.data)

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

    def _ensure_batch_owner(self, request, batch):
        if (
            request.user.role != "admin"
            and batch.dealer_product.dealer_profile.account_id != request.user.id
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Không có quyền trên lô tồn này.")

    def _batch_detail_response(self, request, batch):
        policies_cache = build_policies_cache_for_batches([batch])
        return Response(
            self.get_serializer(
                batch,
                context={
                    **self.get_serializer_context(),
                    "age_discount_policies_cache": policies_cache,
                },
            ).data
        )

    @extend_schema(
        tags=["Dealer Inventory"],
        summary="Đặt ngày hết hạn cho lô",
        request=SetBatchExpiryDateSerializer,
        responses={200: DealerInventoryBatchSerializer},
    )
    @action(detail=True, methods=["post"], url_path="set-expiry-date")
    def set_expiry_date(self, request, pk=None):
        batch = self.get_object()
        self._ensure_batch_owner(request, batch)
        serializer = SetBatchExpiryDateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        batch = set_batch_expiry_date(batch, serializer.validated_data["expiry_date"])
        return self._batch_detail_response(request, batch)

    @extend_schema(
        tags=["Dealer Inventory"],
        summary="Tính lại ngày hết hạn từ storage_duration_days (SP NCC)",
        responses={200: DealerInventoryBatchSerializer},
    )
    @action(detail=True, methods=["post"], url_path="recompute-expiry-date")
    def recompute_expiry_date(self, request, pk=None):
        batch = self.get_object()
        self._ensure_batch_owner(request, batch)
        batch = recompute_batch_expiry_date(batch)
        return self._batch_detail_response(request, batch)

    @extend_schema(
        tags=["Dealer Inventory"],
        summary="Backfill expiry_date cho các lô chưa có (theo SP NCC)",
        request=BackfillExpiryDatesSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "updated": {"type": "integer"},
                    "skipped": {"type": "integer"},
                    "fixed_supplier_products": {"type": "integer"},
                    "skipped_batches": {"type": "array"},
                },
            }
        },
    )
    @action(detail=False, methods=["post"], url_path="backfill-expiry-dates")
    def backfill_expiry_dates(self, request):
        dealer_id = None
        if request.user.role != "admin":
            dealer_profile = getattr(request.user, "dealer_profile", None)
            if dealer_profile is None:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("Chỉ đại lý hoặc admin mới backfill được.")
            dealer_id = dealer_profile.id

        serializer = BackfillExpiryDatesSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = backfill_batch_expiry_dates(
            dealer_profile_id=dealer_id,
            fallback_storage_days=data.get("default_storage_days"),
            fix_supplier_products=data.get("fix_supplier_products", False),
        )
        return Response(result)

    @extend_schema(
        tags=["Dealer Inventory"],
        summary="Đặt giá giảm thủ công cho lô",
        request=SetBatchSalePriceSerializer,
        responses={200: DealerInventoryBatchSerializer},
    )
    @action(detail=True, methods=["post"], url_path="set-sale-price")
    def set_sale_price(self, request, pk=None):
        from .inventory_queries import get_sellable_batches_qs

        batch = self.get_object()
        self._ensure_batch_owner(request, batch)
        if not get_sellable_batches_qs(batch.dealer_product).filter(pk=batch.pk).exists():
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"detail": "Chỉ đặt giá trên lô đang bán được."})
        serializer = SetBatchSalePriceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        batch.manual_sale_price = serializer.validated_data["manual_sale_price"]
        batch.save(update_fields=["manual_sale_price", "updated_at"])
        return self._batch_detail_response(request, batch)

    @extend_schema(
        tags=["Dealer Inventory"],
        summary="Xóa giá giảm thủ công — quay về policy/giá gốc",
        responses={200: DealerInventoryBatchSerializer},
    )
    @action(detail=True, methods=["post"], url_path="clear-sale-price")
    def clear_sale_price(self, request, pk=None):
        batch = self.get_object()
        self._ensure_batch_owner(request, batch)
        batch.manual_sale_price = None
        batch.save(update_fields=["manual_sale_price", "updated_at"])
        return self._batch_detail_response(request, batch)


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

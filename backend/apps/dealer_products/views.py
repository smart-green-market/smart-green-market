"""API sản phẩm đại lý, ảnh và tồn kho."""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.verify_openapi import (
    DEALER_PRODUCT_VERIFY_APPROVE,
    DEALER_PRODUCT_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.permission import IsActive, IsAdmin, IsAdminOrDealer, IsDealer
from common.querysets import ORDER_IMAGE, ORDER_NEWEST, ORDER_UPDATED, filter_admin_or_dealer_account

from .models import (
    DealerInventoryBatch,
    DealerInventoryTransaction,
    DealerProduct,
    DealerProductImage,
    DealerProductStatus,
)
from .serializers import (
    DealerInventoryBatchSerializer,
    DealerInventoryTransactionSerializer,
    DealerInventoryWastageSerializer,
    DealerProductImageSerializer,
    DealerProductListSerializer,
    DealerProductSerializer,
    RecordWastageSerializer,
    VerifyDealerProductSerializer,
)
from .services import record_wastage


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
        responses={
            200: paginated_response_schema(
                DealerProductListSerializer,
                "PaginatedDealerProduct",
            )
        },
    ),
    retrieve=extend_schema(tags=["Dealer Products"], summary="Chi tiết sản phẩm đại lý"),
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
        if self.action in ("list", "retrieve", "verify"):
            return DealerProductListSerializer
        return DealerProductSerializer

    def get_permissions(self):
        if self.action == "verify":
            return [IsAdmin()]
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsActive(), IsDealer()]
        return [IsActive()]

    def get_queryset(self):
        return _filter_dealer_product_scope(self.queryset, self.request.user)

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
    create=extend_schema(tags=["Dealer Product Images"], summary="Thêm ảnh (URL)"),
    update=extend_schema(tags=["Dealer Product Images"], summary="Cập nhật ảnh"),
    partial_update=extend_schema(tags=["Dealer Product Images"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Dealer Product Images"], summary="Xóa ảnh"),
)
class DealerProductImageViewSet(viewsets.ModelViewSet):
    queryset = DealerProductImage.objects.select_related(
        "dealer_product",
        "dealer_product__dealer_profile",
    )
    serializer_class = DealerProductImageSerializer

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
        image = serializer.save()
        if image.is_thumbnail:
            DealerProductImage.objects.filter(
                dealer_product=product,
                is_thumbnail=True,
            ).exclude(pk=image.pk).update(is_thumbnail=False)


@extend_schema_view(
    list=extend_schema(
        tags=["Dealer Inventory"],
        summary="Danh sách lô tồn kho",
        description="Lô hàng nhập từ phiếu nhập hoàn tất." + PAGINATION_QUERY_HELP,
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
        "dealer_product__dealer_profile",
        "purchase_order_item",
        "purchase_order_item__purchase_order",
    ).filter(deleted_at__isnull=True)
    serializer_class = DealerInventoryBatchSerializer

    def get_queryset(self):
        return _filter_inventory_scope(self.queryset, self.request.user)

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

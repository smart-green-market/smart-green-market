"""API phiếu nhập hàng đại lý ↔ nhà cung cấp.

Router: config/urls.py → purchase_orders/urls.py → PurchaseOrderViewSet

| Endpoint | Role | Service |
|----------|------|---------|
| GET/POST /api/purchase-orders/ | Dealer (POST) | create_purchase_orders |
| GET /api/purchase-orders/{id}/ | All (phân quyền) | — |
| POST .../confirm/ | Supplier | supplier_confirm_order |
| POST .../approve-adjustment/ | Dealer | dealer_approve_adjustment |
| POST .../reject/ | Supplier | supplier_reject_order |
| GET .../payment-qr/ | Dealer | get_payment_qr |
| POST .../submit-deposit/ | Dealer | dealer_submit_payment |
| POST .../submit-final-payment/ | Dealer | dealer_submit_payment |
| POST .../verify-payment/ | Supplier | supplier_verify_payment |
| POST .../ship/ | Supplier | supplier_start_shipping |
| POST .../confirm-delivery/ | Dealer | dealer_confirm_delivery |
| POST .../cancel/ | Dealer/Admin | cancel_order |

Config công khai: GET /api/purchase-order-config/
"""

from django.db.models import Prefetch, Q

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import AccountRole
from apps.supplier_products.models import SupplierProductImage
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.openapi_files import multipart_request
from common.permission import IsAdmin, IsAdminOrSupplier, IsDealer, IsSupplier
from common.querysets import ORDER_NEWEST, filter_purchase_orders
from common.status_counts import build_count_status, filter_by_status_param

from common.verify_openapi import (
    PO_REJECT,
    PO_VERIFY_PAYMENT_APPROVE,
    PO_VERIFY_PAYMENT_REJECT,
    VERIFY_REJECT_HELP,
)

from . import services
from .openapi import (
    PO_APPROVE_ADJUSTMENT_DESCRIPTION,
    PO_CANCEL_DESCRIPTION,
    PO_CONFIRM_DELIVERY_DESCRIPTION,
    PO_CONFIRM_DESCRIPTION,
    PO_CREATE_DESCRIPTION,
    PO_CREATE_REQUEST_EXAMPLE,
    PO_CREATE_RESPONSE_EXAMPLE,
    PO_LIST_DESCRIPTION,
    PO_PAYMENT_QR_DESCRIPTION,
    PO_REJECT_DESCRIPTION,
    PO_RETRIEVE_DESCRIPTION,
    PO_SHIP_DESCRIPTION,
    PO_SUBMIT_DEPOSIT_DESCRIPTION,
    PO_SUBMIT_FINAL_DESCRIPTION,
    PO_VERIFY_PAYMENT_DESCRIPTION,
    SUBMIT_PAYMENT_EXAMPLE_NOTE,
    SUBMIT_PAYMENT_MINIMAL_HELP,
    SubmitPaymentForm,
)
from .models import (
    PurchaseOrder,
    PurchaseOrderPayment,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
    PurchaseOrderReturn,
    PurchaseOrderStatus,
)
from .serializers import (
    CancelOrderSerializer,
    NoteSerializer,
    PurchaseOrderCreateSerializer,
    PurchaseOrderBatchCreateResponseSerializer,
    PurchaseOrderDetailSerializer,
    PurchaseOrderListSerializer,
    PurchaseOrderPaymentReadSerializer,
    PurchaseOrderReturnReadSerializer,
    PaymentQrSerializer,
    RequestPurchaseOrderReturnSerializer,
    ReviewReturnSerializer,
    SubmitPaymentSerializer,
    SupplierConfirmSerializer,
    SupplierRejectSerializer,
    VerifyPaymentSerializer,
)


def _detail_queryset():
    return PurchaseOrder.objects.select_related(
        "supplier",
        "dealer",
        "supplier__account",
        "dealer__account",
    ).prefetch_related(
        Prefetch(
            "items__supplier_product__images",
            queryset=SupplierProductImage.objects.order_by("sort_order", "id"),
        ),
        "items__return_items__purchase_order_return",
        "payments__verified_by",
        "returns__items__purchase_order_item__supplier_product",
        "returns__requested_by",
        "returns__reviewed_by",
        "status_histories__changed_by",
    )


def _detail_response(order, request):
    order = _detail_queryset().get(pk=order.pk)
    return PurchaseOrderDetailSerializer(order, context={"request": request}).data


@extend_schema_view(
    list=extend_schema(
        tags=["Purchase Orders"],
        summary="[Danh sách] Phiếu nhập",
        description=(
            "Admin: tất cả. Supplier: đơn gửi tới NCC mình. Dealer: đơn của đại lý mình."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo mã đơn, tên/SĐT người nhận, đại lý hoặc NCC", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái đơn hàng", required=False),
        ],
        responses={
            200: paginated_response_schema(
                PurchaseOrderListSerializer,
                "PaginatedPurchaseOrder",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Purchase Orders"],
        summary="[Chi tiết] Một phiếu nhập",
        description=PO_RETRIEVE_DESCRIPTION,
        responses={200: PurchaseOrderDetailSerializer},
    ),
    create=extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 1] Dealer tạo phiếu (tách theo NCC)",
        description=PO_CREATE_DESCRIPTION,
        request=PurchaseOrderCreateSerializer,
        responses={201: PurchaseOrderBatchCreateResponseSerializer},
        examples=[PO_CREATE_REQUEST_EXAMPLE, PO_CREATE_RESPONSE_EXAMPLE],
    ),
)
class PurchaseOrderViewSet(viewsets.GenericViewSet):
    """ViewSet phiếu nhập — mỗi @action ủy quyền cho services.py xử lý nghiệp vụ."""

    queryset = PurchaseOrder.objects.select_related(
        "supplier",
        "dealer",
        "supplier__account",
        "dealer__account",
        "cancelled_by",
    )
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        if self.action == "list":
            qs = qs.prefetch_related("returns")
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "items__supplier_product__images",
                    queryset=SupplierProductImage.objects.order_by("sort_order", "id"),
                ),
                "items__supplier_product",
                "items__return_items__purchase_order_return",
                "payments__verified_by",
                "returns__items__purchase_order_item__supplier_product",
                "returns__requested_by",
                "returns__reviewed_by",
                "status_histories__changed_by",
            )
        return filter_purchase_orders(qs, self.request.user, ordering=ORDER_NEWEST)

    def get_permissions(self):
        """Phân quyền theo action: dealer tạo/nộp tiền, supplier duyệt/giao, admin xem tất cả."""
        if self.action == "create":
            return [IsDealer()]
        if self.action in (
            "confirm",
            "reject",
            "verify_payment",
            "ship",
            "review_return",
        ):
            return [IsSupplier()]
        if self.action == "payment_qr":
            return [IsAuthenticated()]
        if self.action in (
            "submit_deposit",
            "submit_final_payment",
            "confirm_delivery",
            "request_return",
            "cancel",
        ):
            if self.action == "cancel":
                return [IsAuthenticated()]
            return [IsDealer()]
        return [IsAdminOrSupplier()]

    def list(self, request):
        from common.pagination import LoadMorePagination

        qs = self.get_queryset()

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(order_code__icontains=search)
                | Q(receiver_name__icontains=search)
                | Q(receiver_phone__icontains=search)
                | Q(dealer__store_name__icontains=search)
                | Q(supplier__company_name__icontains=search)
            )

        dealer_id = request.query_params.get("dealer", "").strip()
        if dealer_id.isdigit():
            qs = qs.filter(dealer_id=dealer_id)

        supplier_id = request.query_params.get("supplier", "").strip()
        if supplier_id.isdigit():
            qs = qs.filter(supplier_id=supplier_id)

        count_status = build_count_status(qs, field="status", choices=PurchaseOrderStatus)

        status_param = request.query_params.get("status", "").strip()
        qs = filter_by_status_param(qs, status_param, field="status")

        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = PurchaseOrderListSerializer(
            page, many=True, context={"request": request}
        ).data
        return paginator.get_paginated_response(data, count_status=count_status)

    def retrieve(self, request, pk=None):
        order = self.get_object()
        return Response(_detail_response(order, request))

    def create(self, request):
        serializer = PurchaseOrderCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        orders = serializer.save()
        return Response(
            {
                "orders": [
                    _detail_response(order, request) for order in orders
                ],
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 2a] NCC xác nhận phiếu",
        description=PO_CONFIRM_DESCRIPTION,
        request=SupplierConfirmSerializer,
        responses={200: PurchaseOrderDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.supplier.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SupplierConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.supplier_confirm_order(
            order,
            request.user,
            deposit_percent=serializer.validated_data.get("deposit_percent"),
            note=serializer.validated_data.get("note", ""),
            confirmed_delivery_time=serializer.validated_data["confirmed_delivery_time"],
            items_data=serializer.validated_data.get("items"),
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 2c] Dealer đồng ý điều chỉnh NCC",
        description=PO_APPROVE_ADJUSTMENT_DESCRIPTION,
        request=NoteSerializer,
        responses={200: PurchaseOrderDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="approve-adjustment")
    def approve_adjustment(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.dealer_approve_adjustment(
            order,
            request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 2b] NCC từ chối phiếu",
        description=PO_REJECT_DESCRIPTION,
        request=SupplierRejectSerializer,
        responses={200: PurchaseOrderDetailSerializer},
        examples=[PO_REJECT],
    )
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        order = self.get_object()
        if order.supplier.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SupplierRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.supplier_reject_order(
            order,
            request.user,
            serializer.validated_data["rejection_reason"],
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 3/8] QR VietQR thanh toán",
        description=PO_PAYMENT_QR_DESCRIPTION,
        parameters=[
            OpenApiParameter(
                name="payment_type",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                enum=["deposit", "final_payment"],
                description="`deposit` khi confirmed | `final_payment` khi delivered",
            ),
        ],
        responses={200: PaymentQrSerializer},
    )
    @action(detail=True, methods=["get"], url_path="payment-qr")
    def payment_qr(self, request, pk=None):
        order = self.get_object()
        user = request.user
        if user.role == AccountRole.DEALER and order.dealer.account_id != user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        if user.role not in (AccountRole.DEALER, AccountRole.ADMIN):
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)

        payment_type = request.query_params.get("payment_type", "").strip()
        if payment_type == "final_payment":
            payment_type = PurchaseOrderPaymentType.FINAL_PAYMENT
        elif payment_type == "deposit":
            payment_type = PurchaseOrderPaymentType.DEPOSIT
        else:
            return Response(
                {"payment_type": "Bắt buộc: deposit hoặc final_payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = services.get_payment_qr(order, payment_type)
        return Response(PaymentQrSerializer(payload).data)

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 4] Dealer nộp biên lai cọc",
        description=PO_SUBMIT_DEPOSIT_DESCRIPTION + "\n\n" + SUBMIT_PAYMENT_MINIMAL_HELP,
        request=multipart_request(SubmitPaymentForm),
        responses={201: PurchaseOrderPaymentReadSerializer},
        examples=[SUBMIT_PAYMENT_EXAMPLE_NOTE],
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="submit-deposit",
        parser_classes=[MultiPartParser, FormParser],
    )
    def submit_deposit(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SubmitPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = services.dealer_submit_payment(
            order,
            request.user,
            PurchaseOrderPaymentType.DEPOSIT,
            serializer.validated_data,
        )
        return Response(
            PurchaseOrderPaymentReadSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 9] Dealer nộp biên lai TT cuối",
        description=PO_SUBMIT_FINAL_DESCRIPTION + "\n\n" + SUBMIT_PAYMENT_MINIMAL_HELP,
        request=multipart_request(SubmitPaymentForm),
        responses={201: PurchaseOrderPaymentReadSerializer},
        examples=[SUBMIT_PAYMENT_EXAMPLE_NOTE],
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="submit-final-payment",
        parser_classes=[MultiPartParser, FormParser],
    )
    def submit_final_payment(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SubmitPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = services.dealer_submit_payment(
            order,
            request.user,
            PurchaseOrderPaymentType.FINAL_PAYMENT,
            serializer.validated_data,
        )
        return Response(
            PurchaseOrderPaymentReadSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 5/10] NCC duyệt / từ chối CK",
        description=PO_VERIFY_PAYMENT_DESCRIPTION + VERIFY_REJECT_HELP,
        request=VerifyPaymentSerializer,
        responses={200: PurchaseOrderPaymentReadSerializer},
        examples=[PO_VERIFY_PAYMENT_APPROVE, PO_VERIFY_PAYMENT_REJECT],
    )
    @action(detail=True, methods=["post"], url_path="verify-payment")
    def verify_payment(self, request, pk=None):
        order = self.get_object()
        if order.supplier.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_id = serializer.validated_data["payment_id"]
        try:
            payment = PurchaseOrderPayment.objects.get(
                pk=payment_id,
                purchase_order=order,
            )
        except PurchaseOrderPayment.DoesNotExist:
            return Response(
                {"detail": "Thanh toán không thuộc phiếu này."},
                status=status.HTTP_404_NOT_FOUND,
            )
        approved = (
            serializer.validated_data["status"] == PurchaseOrderPaymentStatus.VERIFIED
        )
        payment = services.supplier_verify_payment(
            payment,
            request.user,
            approved=approved,
            rejection_reason=serializer.validated_data.get("rejection_reason", ""),
        )
        order.refresh_from_db()
        return Response(PurchaseOrderPaymentReadSerializer(payment).data)

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 6] NCC bắt đầu giao hàng",
        description=PO_SHIP_DESCRIPTION,
        request=NoteSerializer,
        responses={200: PurchaseOrderDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def ship(self, request, pk=None):
        order = self.get_object()
        if order.supplier.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.supplier_start_shipping(
            order, request.user, note=serializer.validated_data.get("note", "")
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 7] Dealer xác nhận nhận hàng",
        description=PO_CONFIRM_DELIVERY_DESCRIPTION,
        request=NoteSerializer,
        responses={200: PurchaseOrderDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="confirm-delivery")
    def confirm_delivery(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.dealer_confirm_delivery(
            order, request.user, note=serializer.validated_data.get("note", "")
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Hủy] Hủy phiếu nhập",
        description=PO_CANCEL_DESCRIPTION,
        request=CancelOrderSerializer,
        responses={200: PurchaseOrderDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        is_admin = request.user.role == AccountRole.ADMIN
        if not is_admin and order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.cancel_order(
            order,
            request.user,
            note=serializer.validated_data["reason"],
            is_admin=is_admin,
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Trả hàng] Dealer yêu cầu trả hàng",
        request=RequestPurchaseOrderReturnSerializer,
        responses={201: PurchaseOrderReturnReadSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="request-return",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def request_return(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = RequestPurchaseOrderReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        po_return = services.dealer_request_return(
            order,
            request.user,
            reason=serializer.validated_data["reason"],
            items=serializer.validated_data["items"],
            evidence_file=serializer.validated_data.get("evidence_file"),
        )
        return Response(
            PurchaseOrderReturnReadSerializer(po_return, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Trả hàng] NCC duyệt/từ chối yêu cầu trả hàng",
        request=ReviewReturnSerializer,
        responses={200: PurchaseOrderReturnReadSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path=r"returns/(?P<return_id>[^/.]+)/review",
    )
    def review_return(self, request, pk=None, return_id=None):
        order = self.get_object()
        if order.supplier.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ReviewReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            po_return = PurchaseOrderReturn.objects.get(pk=return_id, purchase_order=order)
        except PurchaseOrderReturn.DoesNotExist:
            return Response(
                {"detail": "Yêu cầu trả hàng không thuộc phiếu này."},
                status=status.HTTP_404_NOT_FOUND,
            )
        po_return = services.supplier_review_return(
            po_return,
            request.user,
            approved=serializer.validated_data["approved"],
            review_note=serializer.validated_data.get("review_note", ""),
        )
        return Response(
            PurchaseOrderReturnReadSerializer(po_return, context={"request": request}).data
        )

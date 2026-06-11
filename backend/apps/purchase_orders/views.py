"""API phiếu nhập hàng đại lý ↔ nhà cung cấp.

Router: config/urls.py → purchase_orders/urls.py → PurchaseOrderViewSet

| Endpoint | Role | Service |
|----------|------|---------|
| GET/POST /api/purchase-orders/ | Dealer (POST) | create_purchase_order |
| GET /api/purchase-orders/{id}/ | All (phân quyền) | — |
| POST .../confirm/ | Supplier | supplier_confirm_order |
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

from django.db.models import Prefetch

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import AccountRole
from apps.supplier_products.models import SupplierProductImage
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.permission import IsAdmin, IsAdminOrSupplier, IsDealer, IsSupplier
from common.querysets import ORDER_NEWEST, filter_purchase_orders

from common.verify_openapi import (
    PO_REJECT,
    PO_VERIFY_PAYMENT_APPROVE,
    PO_VERIFY_PAYMENT_REJECT,
    VERIFY_REJECT_HELP,
)

from . import services
from .openapi import (
    SUBMIT_PAYMENT_EXAMPLE_NOTE,
    SUBMIT_PAYMENT_MINIMAL_HELP,
    SubmitPaymentForm,
)
from .models import (
    PurchaseOrder,
    PurchaseOrderPayment,
    PurchaseOrderPaymentStatus,
    PurchaseOrderPaymentType,
)
from .serializers import (
    CancelOrderSerializer,
    NoteSerializer,
    PurchaseOrderCreateSerializer,
    PurchaseOrderDetailSerializer,
    PurchaseOrderListSerializer,
    PurchaseOrderPaymentReadSerializer,
    PaymentQrSerializer,
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
        "payments__verified_by",
        "status_histories__changed_by",
    )


def _detail_response(order, request):
    order = _detail_queryset().get(pk=order.pk)
    return PurchaseOrderDetailSerializer(order, context={"request": request}).data


@extend_schema_view(
    list=extend_schema(
        tags=["Purchase Orders"],
        summary="Danh sách phiếu nhập",
        description=(
            "Admin: tất cả. Supplier: đơn gửi tới NCC mình. Dealer: đơn của đại lý mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                PurchaseOrderListSerializer,
                "PaginatedPurchaseOrder",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Purchase Orders"],
        summary="Chi tiết phiếu nhập",
        responses={200: PurchaseOrderDetailSerializer},
    ),
    create=extend_schema(
        tags=["Purchase Orders"],
        summary="Đại lý tạo phiếu nhập",
        description="Gửi phiếu → trạng thái `pending_supplier_confirmation`.",
        request=PurchaseOrderCreateSerializer,
        responses={201: PurchaseOrderDetailSerializer},
    ),
)
class PurchaseOrderViewSet(viewsets.GenericViewSet):
    """ViewSet phiếu nhập — mỗi @action ủy quyền cho services.py xử lý nghiệp vụ."""

    queryset = PurchaseOrder.objects.select_related(
        "supplier",
        "dealer",
        "supplier__account",
        "dealer__account",
    )
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "items__supplier_product__images",
                    queryset=SupplierProductImage.objects.order_by("sort_order", "id"),
                ),
                "items__supplier_product",
                "payments__verified_by",
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
        ):
            return [IsSupplier()]
        if self.action == "payment_qr":
            return [IsAuthenticated()]
        if self.action in (
            "submit_deposit",
            "submit_final_payment",
            "confirm_delivery",
            "cancel",
        ):
            if self.action == "cancel":
                return [IsAuthenticated()]
            return [IsDealer()]
        return [IsAdminOrSupplier()]

    def list(self, request):
        from common.pagination import LoadMorePagination

        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(self.get_queryset(), request, view=self)
        data = PurchaseOrderListSerializer(
            page, many=True, context={"request": request}
        ).data
        return paginator.get_paginated_response(data)

    def retrieve(self, request, pk=None):
        order = self.get_object()
        return Response(_detail_response(order, request))

    def create(self, request):
        serializer = PurchaseOrderCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(_detail_response(order, request), status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["Purchase Orders"],
        summary="NCC xác nhận phiếu",
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
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Purchase Orders"],
        summary="NCC từ chối phiếu",
        description="`rejection_reason` bắt buộc.",
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
        summary="Lấy QR VietQR thanh toán",
        description=(
            "Dealer quét QR chuyển khoản tới tài khoản NCC.\n\n"
            "- `payment_type=deposit` — khi `status=confirmed`\n"
            "- `payment_type=final_payment` — khi `status=delivered`\n\n"
            "Hiển thị `qr_image_url` bằng thẻ `<img>` — URL trỏ tới img.vietqr.io."
        ),
        parameters=[
            OpenApiParameter(
                name="payment_type",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                enum=["deposit", "final_payment"],
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
        summary="Đại lý gửi xác nhận thanh toán cọc",
        description=SUBMIT_PAYMENT_MINIMAL_HELP,
        request={"multipart/form-data": SubmitPaymentForm},
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
        summary="Đại lý gửi xác nhận thanh toán cuối",
        description=SUBMIT_PAYMENT_MINIMAL_HELP,
        request={"multipart/form-data": SubmitPaymentForm},
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
        summary="NCC xác nhận / từ chối thanh toán",
        description=(
            "Lấy `payment_id` từ `payments[]` của phiếu.\n"
            "`status=rejected` bắt buộc `rejection_reason`."
            + VERIFY_REJECT_HELP
        ),
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
        summary="NCC bắt đầu giao hàng",
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
        summary="Đại lý xác nhận đã nhận hàng",
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
        summary="Hủy phiếu nhập",
        description="Dealer: trước khi NCC xử lý hoặc sau confirm chưa cọc. Admin: mọi trạng thái chưa terminal.",
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
            note=serializer.validated_data.get("note", ""),
            is_admin=is_admin,
        )
        return Response(_detail_response(order, request))

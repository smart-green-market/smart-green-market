"""API đơn hàng buyer — dealer / admin quản lý."""

from django.db.models import Count, Prefetch, Q

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import AccountRole
from apps.dealer_products.models import DealerProductImage
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import LoadMorePagination
from common.permission import IsAdmin, IsAdminOrDealer, IsDealer
from common.querysets import ORDER_NEWEST, filter_customer_orders
from common.status_counts import build_count_status, filter_by_status_param

from . import services
from . import delivery_reschedule_services
from .models import Order, OrderReturn, OrderStatus
from .serializers import (
    CancelOrderSerializer,
    NoteSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderReturnReadSerializer,
    ProposeDeliveryRescheduleSerializer,
    ReviewReturnSerializer,
)


def _detail_queryset():
    return Order.objects.select_related(
        "dealer",
        "dealer__account",
        "customer",
        "customer__user",
        "customer_address",
        "cancelled_by",
    ).prefetch_related(
        Prefetch(
            "items__dealer_product__images",
            queryset=DealerProductImage.objects.order_by("sort_order", "id"),
        ),
        "items__dealer_product",
        "items__batch",
        "payments",
        "returns__items__order_item",
        "returns__requested_by",
        "returns__reviewed_by",
        "status_histories__changed_by",
    )


def _detail_response(order, request):
    order = _detail_queryset().get(pk=order.pk)
    return OrderDetailSerializer(order, context={"request": request}).data


@extend_schema_view(
    list=extend_schema(
        tags=["Customer Orders"],
        summary="Danh sách đơn hàng buyer",
        description=(
            "Admin: tất cả. Dealer: đơn gửi tới cửa hàng mình."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo mã đơn, khách hàng", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái", required=False),
        ],
        responses={
            200: paginated_response_schema(OrderListSerializer, "PaginatedCustomerOrder"),
        },
    ),
    retrieve=extend_schema(
        tags=["Customer Orders"],
        summary="Chi tiết đơn hàng buyer",
        responses={200: OrderDetailSerializer},
    ),
)
class CustomerOrderViewSet(viewsets.GenericViewSet):
    """Đại lý xử lý đơn buyer: xác nhận → chuẩn bị → giao hàng."""

    queryset = Order.objects.select_related(
        "dealer",
        "customer",
        "customer__user",
        "cancelled_by",
    )
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.annotate(item_count=Count("items"))
        if self.action == "list":
            qs = qs.prefetch_related("returns")
        if self.action == "retrieve":
            qs = _detail_queryset().annotate(item_count=Count("items"))
        return filter_customer_orders(qs, self.request.user, ordering=ORDER_NEWEST)

    def _apply_customer_order_list_filters(self, qs, request, *, apply_status=True):
        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(order_code__icontains=search)
                | Q(customer__user__first_name__icontains=search)
                | Q(customer__user__last_name__icontains=search)
                | Q(customer__user__phone__icontains=search)
                | Q(receiver_name__icontains=search)
                | Q(receiver_phone__icontains=search)
            )
        if apply_status:
            qs = filter_by_status_param(
                qs, request.query_params.get("status"), field="status"
            )
        return qs

    def get_permissions(self):
        if self.action in ("confirm", "start_processing", "ship", "propose_delivery_reschedule"):
            return [IsDealer()]
        if self.action in ("list", "retrieve", "cancel", "review_return"):
            return [IsAdminOrDealer()]
        return [IsAuthenticated()]

    def list(self, request):
        base_qs = self._apply_customer_order_list_filters(
            self.get_queryset(), request, apply_status=False
        )
        count_status = build_count_status(base_qs, field="status", choices=OrderStatus)
        qs = filter_by_status_param(base_qs, request.query_params.get("status"), field="status")
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = OrderListSerializer(page, many=True, context={"request": request}).data
        return paginator.get_paginated_response(data, count_status=count_status)

    def retrieve(self, request, pk=None):
        order = self.get_object()
        if request.user.role == AccountRole.DEALER:
            if order.dealer.account_id != request.user.id:
                return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Customer Orders"],
        summary="Đại lý xác nhận đơn",
        description="Chuyển `pending` → `confirmed`.",
        request=NoteSerializer,
        responses={200: OrderDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.dealer_confirm_order(
            order,
            request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Customer Orders"],
        summary="Đại lý bắt đầu đóng gói",
        description="Chuyển `confirmed` → `processing`.",
        request=NoteSerializer,
        responses={200: OrderDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="start-processing")
    def start_processing(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.dealer_start_processing(
            order,
            request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Customer Orders"],
        summary="Đại lý bàn giao vận chuyển",
        description="Chuyển `processing` → `shipping`.",
        request=NoteSerializer,
        responses={200: OrderDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def ship(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.dealer_start_shipping(
            order,
            request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Customer Orders"],
        summary="Đại lý đề xuất đổi ngày giao",
        description="Áp dụng khi đơn `waiting_stock` — chuyển sang `delivery_reschedule_proposed`.",
        request=ProposeDeliveryRescheduleSerializer,
        responses={200: OrderDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="propose-delivery-reschedule")
    def propose_delivery_reschedule(self, request, pk=None):
        order = self.get_object()
        if order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProposeDeliveryRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = delivery_reschedule_services.dealer_propose_delivery_reschedule(
            order,
            request.user,
            proposed_delivery_time=serializer.validated_data["proposed_delivery_time"],
            reason=serializer.validated_data["reason"],
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Customer Orders"],
        summary="Hủy đơn hàng buyer",
        description="Dealer/admin hủy đơn trước khi giao và hoàn tồn kho theo batch.",
        request=CancelOrderSerializer,
        responses={200: OrderDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        is_admin = request.user.role == AccountRole.ADMIN
        if not is_admin and order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.cancel_customer_order(
            order,
            request.user,
            reason=serializer.validated_data["reason"],
            actor="admin" if is_admin else "dealer",
        )
        return Response(_detail_response(order, request))

    @extend_schema(
        tags=["Customer Orders"],
        summary="Duyệt/từ chối yêu cầu trả hàng buyer",
        request=ReviewReturnSerializer,
        responses={200: OrderReturnReadSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path=r"returns/(?P<return_id>[^/.]+)/review",
    )
    def review_return(self, request, pk=None, return_id=None):
        order = self.get_object()
        is_admin = request.user.role == AccountRole.ADMIN
        if not is_admin and order.dealer.account_id != request.user.id:
            return Response({"detail": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ReviewReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order_return = OrderReturn.objects.get(pk=return_id, order=order)
        except OrderReturn.DoesNotExist:
            return Response(
                {"detail": "Yêu cầu trả hàng không thuộc đơn này."},
                status=status.HTTP_404_NOT_FOUND,
            )
        order_return = services.dealer_review_return(
            order_return,
            request.user,
            approved=serializer.validated_data["approved"],
            review_note=serializer.validated_data.get("review_note", ""),
        )
        return Response(
            OrderReturnReadSerializer(order_return, context={"request": request}).data
        )

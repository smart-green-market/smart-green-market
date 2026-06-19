"""API đơn hàng buyer — dealer / admin quản lý."""

from django.db.models import Count, Prefetch

from drf_spectacular.utils import extend_schema, extend_schema_view
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

from . import services
from .models import Order
from .serializers import NoteSerializer, OrderDetailSerializer, OrderListSerializer


def _detail_queryset():
    return Order.objects.select_related(
        "dealer",
        "dealer__account",
        "customer",
        "customer__user",
        "customer_address",
    ).prefetch_related(
        Prefetch(
            "items__dealer_product__images",
            queryset=DealerProductImage.objects.order_by("sort_order", "id"),
        ),
        "items__dealer_product",
        "items__batch",
        "payments",
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

    queryset = Order.objects.select_related("dealer", "customer", "customer__user")
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.annotate(item_count=Count("items"))
        if self.action == "retrieve":
            qs = _detail_queryset().annotate(item_count=Count("items"))
        status_filter = self.request.query_params.get("status")
        qs = filter_customer_orders(qs, self.request.user, ordering=ORDER_NEWEST)
        if status_filter:
            qs = qs.filter(status=status_filter.strip())
        return qs

    def get_permissions(self):
        if self.action in ("confirm", "start_processing", "ship"):
            return [IsDealer()]
        if self.action in ("list", "retrieve"):
            return [IsAdminOrDealer()]
        return [IsAuthenticated()]

    def list(self, request):
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(self.get_queryset(), request, view=self)
        data = OrderListSerializer(page, many=True, context={"request": request}).data
        return paginator.get_paginated_response(data)

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

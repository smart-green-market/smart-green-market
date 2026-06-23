"""API đặt hàng buyer trên storefront."""

from django.db.models import Count

from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStorefrontCustomer
from apps.customers.services import get_active_dealer_by_slug
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import paginate_queryset

from . import services
from .models import Order
from .delivery_slots import get_available_delivery_slots
from .serializers import (
    DeliverySlotsResponseSerializer,
    NoteSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)
from .views import _detail_queryset, _detail_response


def _get_dealer_or_404(dealer_slug):
    try:
        return get_active_dealer_by_slug(dealer_slug)
    except Exception as exc:
        raise NotFound("Gian hàng không tồn tại hoặc chưa hoạt động.") from exc


def _buyer_orders_qs(request, dealer):
    if not hasattr(request.user, "customer_profile"):
        return Order.objects.none()
    return (
        _detail_queryset()
        .filter(customer=request.user.customer_profile, dealer=dealer)
    )


class StorefrontOrderListCreateView(APIView):
    """Danh sách / tạo đơn hàng buyer trên gian hàng."""

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Orders"],
        operation_id="storefront_orders_list",
        summary="Danh sách đơn hàng của tôi",
        description="Buyer xem đơn đã đặt tại cửa hàng này." + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(OrderListSerializer, "PaginatedStorefrontOrder"),
        },
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        qs = (
            _buyer_orders_qs(request, dealer)
            .annotate(item_count=Count("items"))
            .order_by("-created_at", "-id")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.strip())

        def serialize(page):
            return OrderListSerializer(page, many=True, context={"request": request}).data

        return paginate_queryset(self, request, qs, serialize)

    @extend_schema(
        tags=["Storefront Orders"],
        operation_id="storefront_orders_create",
        summary="Đặt hàng (COD)",
        description=(
            "### Luồng checkout (FE)\n"
            "1. `GET .../delivery-slots/` — lấy danh sách ngày + slot khả dụng\n"
            "2. Chọn slot có `available: true`\n"
            "3. `POST` body **chỉ gửi** `delivery_date` + `delivery_slot` "
            "(không gửi `delivery_time`)\n\n"
            "| Field | Nguồn |\n"
            "|-------|--------|\n"
            "| `delivery_date` | `dates[].date` từ delivery-slots |\n"
            "| `delivery_slot` | `dates[].slots[].id` (`morning` / `afternoon`) |\n\n"
            "Phí ship cố định 10.000 VND, thanh toán COD. Trừ tồn ngay. "
            "Trạng thái ban đầu: `pending`."
        ),
        request=OrderCreateSerializer,
        responses={201: OrderDetailSerializer},
        examples=[
            OpenApiExample(
                "Checkout — delivery_date + delivery_slot",
                value={
                    "items": [{"dealer_product_id": 1, "quantity": 2}],
                    "customer_address_id": 1,
                    "delivery_date": "2026-06-20",
                    "delivery_slot": "morning",
                    "note": "Giao buổi sáng",
                },
                request_only=True,
            ),
        ],
    )
    def post(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        if not hasattr(request.user, "customer_profile"):
            raise ValidationError({"detail": "Hồ sơ khách hàng chưa được tạo."})

        serializer = OrderCreateSerializer(
            data=request.data,
            context={"request": request, "dealer": dealer},
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(_detail_response(order, request), status=status.HTTP_201_CREATED)


class StorefrontDeliverySlotsView(APIView):
    """Khung giờ giao rau khả dụng — backend tính, FE chỉ hiển thị."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Orders"],
        operation_id="storefront_delivery_slots",
        summary="Khung giờ giao hàng khả dụng",
        description=(
            "Trả danh sách ngày (2 ngày: hôm nay và ngày mai) và slot Sáng/Chiều. "
            "FE không tự tính — chỉ render slot `available=true` và gửi lại "
            "`delivery_date`+`delivery_slot` hoặc `delivery_time` khi đặt hàng."
        ),
        responses={200: DeliverySlotsResponseSerializer},
        auth=[],
    )
    def get(self, request, dealer_slug):
        _get_dealer_or_404(dealer_slug)
        return Response(DeliverySlotsResponseSerializer(get_available_delivery_slots()).data)


class StorefrontOrderDetailView(APIView):
    """Chi tiết một đơn hàng buyer."""

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Orders"],
        operation_id="storefront_orders_retrieve",
        summary="Chi tiết đơn hàng",
        responses={200: OrderDetailSerializer},
    )
    def get(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        try:
            order = _buyer_orders_qs(request, dealer).get(pk=pk)
        except Order.DoesNotExist as exc:
            raise NotFound("Đơn hàng không tồn tại.") from exc
        return Response(_detail_response(order, request))


class StorefrontOrderConfirmReceivedView(APIView):
    """Buyer xác nhận đã nhận hàng."""

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Orders"],
        operation_id="storefront_orders_confirm_received",
        summary="Xác nhận đã nhận hàng",
        description="Chuyển `shipping` → `completed`, đánh dấu COD đã thanh toán.",
        request=NoteSerializer,
        responses={200: OrderDetailSerializer},
    )
    def post(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        try:
            order = _buyer_orders_qs(request, dealer).get(pk=pk)
        except Order.DoesNotExist as exc:
            raise NotFound("Đơn hàng không tồn tại.") from exc

        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.buyer_confirm_received(
            order,
            request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(_detail_response(order, request))

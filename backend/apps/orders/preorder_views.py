"""API YC đặt trước — storefront (buyer) và dealer."""

from django.db.models import Count, Q

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStorefrontCustomer
from apps.customers.services import get_active_dealer_by_slug
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import paginate_queryset
from common.permission import IsDealer
from common.querysets import filter_customer_orders

from . import preorder_services
from .models import PreOrderRequest, PreOrderRequestStatus
from .preorder_serializers import (
    CheckStockRequestSerializer,
    CheckStockResultSerializer,
    PreOrderNoteSerializer,
    PreOrderProposeSerializer,
    PreOrderRejectSerializer,
    PreOrderRequestCreateSerializer,
    PreOrderRequestDetailSerializer,
    PreOrderRequestListSerializer,
)
from .serializers import OrderDetailSerializer
from .views import _detail_queryset, _detail_response


def _get_dealer_or_404(dealer_slug):
    try:
        return get_active_dealer_by_slug(dealer_slug)
    except Exception as exc:
        raise NotFound("Gian hàng không tồn tại hoặc chưa hoạt động.") from exc


def _buyer_preorder_qs(request, dealer):
    if not hasattr(request.user, "customer_profile"):
        return PreOrderRequest.objects.none()
    return PreOrderRequest.objects.filter(
        customer=request.user.customer_profile,
        dealer=dealer,
    ).prefetch_related("items")


class StorefrontCheckStockView(APIView):
    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Pre-orders"],
        summary="Kiểm tra tồn kho trước checkout",
        request=CheckStockRequestSerializer,
        responses={200: CheckStockResultSerializer(many=True)},
    )
    def post(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        serializer = CheckStockRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        results = preorder_services.check_items_stock(
            dealer,
            serializer.validated_data["items"],
        )
        return Response(CheckStockResultSerializer(results, many=True).data)


class StorefrontPreOrderListCreateView(APIView):
    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Pre-orders"],
        summary="Danh sách YC đặt trước của tôi",
        responses={
            200: paginated_response_schema(
                PreOrderRequestListSerializer,
                "PaginatedStorefrontPreOrder",
            ),
        },
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        qs = (
            _buyer_preorder_qs(request, dealer)
            .annotate(item_count=Count("items"))
            .order_by("-created_at", "-id")
        )

        def serialize(page):
            return PreOrderRequestListSerializer(page, many=True).data

        return paginate_queryset(self, request, qs, serialize)

    @extend_schema(
        tags=["Storefront Pre-orders"],
        summary="Gửi YC đặt trước",
        request=PreOrderRequestCreateSerializer,
        responses={201: PreOrderRequestDetailSerializer},
    )
    def post(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        if not hasattr(request.user, "customer_profile"):
            raise ValidationError({"detail": "Hồ sơ khách hàng chưa được tạo."})
        serializer = PreOrderRequestCreateSerializer(
            data=request.data,
            context={"request": request, "dealer": dealer},
        )
        serializer.is_valid(raise_exception=True)
        preorder = serializer.save()
        preorder = PreOrderRequest.objects.prefetch_related("items").get(pk=preorder.pk)
        return Response(
            PreOrderRequestDetailSerializer(preorder).data,
            status=status.HTTP_201_CREATED,
        )


class StorefrontPreOrderDetailView(APIView):
    permission_classes = [IsStorefrontCustomer]

    def _get_object(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        try:
            return _buyer_preorder_qs(request, dealer).get(pk=pk)
        except PreOrderRequest.DoesNotExist as exc:
            raise NotFound("YC đặt trước không tồn tại.") from exc

    @extend_schema(
        tags=["Storefront Pre-orders"],
        summary="Chi tiết YC đặt trước",
        responses={200: PreOrderRequestDetailSerializer},
    )
    def get(self, request, dealer_slug, pk):
        obj = self._get_object(request, dealer_slug, pk)
        return Response(PreOrderRequestDetailSerializer(obj).data)


class StorefrontPreOrderAcceptView(APIView):
    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Pre-orders"],
        summary="Customer đồng ý đề xuất → tạo Order waiting_stock",
        responses={200: OrderDetailSerializer},
    )
    def post(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        try:
            preorder = _buyer_preorder_qs(request, dealer).get(pk=pk)
        except PreOrderRequest.DoesNotExist as exc:
            raise NotFound("YC đặt trước không tồn tại.") from exc
        order = preorder_services.customer_accept_preorder(preorder, request.user)
        return Response(_detail_response(order, request))


class StorefrontPreOrderRejectView(APIView):
    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Pre-orders"],
        summary="Customer từ chối đề xuất đại lý",
        request=PreOrderRejectSerializer,
        responses={200: PreOrderRequestDetailSerializer},
    )
    def post(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        try:
            preorder = _buyer_preorder_qs(request, dealer).get(pk=pk)
        except PreOrderRequest.DoesNotExist as exc:
            raise NotFound("YC đặt trước không tồn tại.") from exc
        serializer = PreOrderRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preorder = preorder_services.customer_reject_preorder(
            preorder,
            request.user,
            reason=serializer.validated_data["reason"],
        )
        return Response(PreOrderRequestDetailSerializer(preorder).data)


@extend_schema_view(
    list=extend_schema(
        tags=["Pre-order Requests"],
        summary="Danh sách YC đặt trước (dealer)",
        description=PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                PreOrderRequestListSerializer,
                "PaginatedPreOrderRequest",
            ),
        },
    ),
    retrieve=extend_schema(
        tags=["Pre-order Requests"],
        summary="Chi tiết YC đặt trước",
        responses={200: PreOrderRequestDetailSerializer},
    ),
)
class PreOrderRequestViewSet(viewsets.GenericViewSet):
    queryset = PreOrderRequest.objects.select_related(
        "customer",
        "customer__user",
        "dealer",
    ).prefetch_related("items")
    permission_classes = [IsAuthenticated, IsDealer]

    def get_queryset(self):
        qs = self.queryset.annotate(item_count=Count("items"))
        return filter_customer_orders(
            qs,
            self.request.user,
            ordering=["-created_at", "-id"],
            pending_field=None,
        )

    def list(self, request):
        qs = self.get_queryset()
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.strip())
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(request_code__icontains=search)
                | Q(customer__user__first_name__icontains=search)
                | Q(customer__user__last_name__icontains=search)
                | Q(receiver_name__icontains=search)
            )

        def serialize(page):
            return PreOrderRequestListSerializer(page, many=True).data

        return paginate_queryset(self, request, qs, serialize)

    def retrieve(self, request, pk=None):
        obj = self.get_queryset().get(pk=pk)
        return Response(PreOrderRequestDetailSerializer(obj).data)

    @extend_schema(
        tags=["Pre-order Requests"],
        request=PreOrderNoteSerializer,
        responses={200: PreOrderRequestDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        preorder = self.get_queryset().get(pk=pk)
        serializer = PreOrderNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preorder = preorder_services.dealer_confirm_preorder(
            preorder,
            request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(PreOrderRequestDetailSerializer(preorder).data)

    @extend_schema(
        tags=["Pre-order Requests"],
        request=PreOrderProposeSerializer,
        responses={200: PreOrderRequestDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def propose(self, request, pk=None):
        preorder = self.get_queryset().get(pk=pk)
        serializer = PreOrderProposeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preorder = preorder_services.dealer_propose_preorder(
            preorder,
            request.user,
            proposed_delivery_time=serializer.validated_data.get(
                "proposed_delivery_time"
            ),
            item_quantities=serializer.validated_data.get("item_quantities"),
            note=serializer.validated_data.get("note", ""),
        )
        return Response(PreOrderRequestDetailSerializer(preorder).data)

    @extend_schema(
        tags=["Pre-order Requests"],
        request=PreOrderRejectSerializer,
        responses={200: PreOrderRequestDetailSerializer},
    )
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        preorder = self.get_queryset().get(pk=pk)
        serializer = PreOrderRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preorder = preorder_services.dealer_reject_preorder(
            preorder,
            request.user,
            reason=serializer.validated_data["reason"],
        )
        return Response(PreOrderRequestDetailSerializer(preorder).data)

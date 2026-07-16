"""API quản lý hạng thành viên và điểm tích lũy."""

from django.db.models import Count
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import CustomerProfile
from apps.customers.permissions import IsStorefrontCustomer
from apps.customers.services import customer_profile_detail_queryset, get_active_dealer_by_slug
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import LoadMorePagination
from common.permission import IsAdminOrDealer, IsDealer

from .models import CustomerTierHistory, DealerLoyaltySettings, LoyaltyPointTransaction, LoyaltyTier
from .serializers import (
    CustomerTierHistorySerializer,
    DealerLoyaltySettingsSerializer,
    LoyaltyPointTransactionSerializer,
    LoyaltyStatusSerializer,
    LoyaltyTierSerializer,
    LoyaltyTierStatsSerializer,
    LoyaltyTierWriteSerializer,
    ManualLoyaltyAdjustSerializer,
    serialize_loyalty_status,
)
from .services import (
    get_dealer_loyalty_settings,
    manual_adjust_points,
    recalculate_customer_tiers_for_dealer,
)


def _get_dealer_for_user(user):
    if user.role == "admin":
        return None
    try:
        return user.dealer_profile
    except Exception as exc:
        raise PermissionDenied("Tài khoản đại lý chưa có hồ sơ.") from exc


def _filter_tiers_for_user(qs, user):
    if user.role == "admin":
        return qs
    dealer = _get_dealer_for_user(user)
    return qs.filter(dealer=dealer)


@extend_schema_view(
    list=extend_schema(
        tags=["Loyalty Tiers"],
        summary="Danh sách hạng thành viên",
        description="Dealer chỉ thấy hạng của cửa hàng mình." + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(LoyaltyTierSerializer, "PaginatedLoyaltyTier"),
        },
    ),
    retrieve=extend_schema(
        tags=["Loyalty Tiers"],
        summary="Chi tiết hạng thành viên",
        responses={200: LoyaltyTierSerializer},
    ),
    create=extend_schema(
        tags=["Loyalty Tiers"],
        summary="Tạo hạng thành viên",
        request=LoyaltyTierWriteSerializer,
        responses={201: LoyaltyTierSerializer},
    ),
    partial_update=extend_schema(
        tags=["Loyalty Tiers"],
        summary="Cập nhật hạng thành viên",
        request=LoyaltyTierWriteSerializer,
        responses={200: LoyaltyTierSerializer},
    ),
    update=extend_schema(
        tags=["Loyalty Tiers"],
        summary="Cập nhật toàn bộ hạng thành viên",
        request=LoyaltyTierWriteSerializer,
        responses={200: LoyaltyTierSerializer},
    ),
)
class LoyaltyTierViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "put", "head", "options"]
    permission_classes = [IsAdminOrDealer]
    pagination_class = LoadMorePagination

    def get_queryset(self):
        qs = LoyaltyTier.objects.select_related("dealer").order_by("level", "min_points", "id")
        return _filter_tiers_for_user(qs, self.request.user)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return LoyaltyTierWriteSerializer
        return LoyaltyTierSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user.role == "dealer":
            context["dealer"] = _get_dealer_for_user(self.request.user)
        return context

    def perform_create(self, serializer):
        if self.request.user.role == "dealer":
            dealer = _get_dealer_for_user(self.request.user)
            serializer.save(dealer=dealer, is_system=False)
            return
        dealer_id = self.request.data.get("dealer")
        if not dealer_id:
            raise ValidationError({"dealer": "Admin cần chỉ định đại lý."})
        from apps.dealers.models import DealerProfile

        dealer = DealerProfile.objects.get(pk=dealer_id)
        serializer.save(dealer=dealer, is_system=False)

    def perform_update(self, serializer):
        instance = serializer.save()
        recalculate_customer_tiers_for_dealer(
            instance.dealer,
            reason="Điều chỉnh cấu hình hạng thành viên",
        )

    @extend_schema(
        tags=["Loyalty Tiers"],
        summary="Thống kê số khách theo hạng",
        responses={200: LoyaltyTierStatsSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        if request.user.role != "dealer":
            raise PermissionDenied("Chỉ đại lý mới xem thống kê hạng của cửa hàng mình.")
        dealer = _get_dealer_for_user(request.user)
        tiers_qs = self.get_queryset().filter(dealer=dealer)
        counts = {
            row["current_tier_id"]: row["total"]
            for row in CustomerProfile.objects.filter(
                user__store_dealer=dealer,
            )
            .values("current_tier_id")
            .annotate(total=Count("id"))
        }

        payload = []
        for tier in tiers_qs:
            payload.append(
                {
                    "tier": tier,
                    "customer_count": counts.get(tier.id, 0),
                }
            )
        return Response(LoyaltyTierStatsSerializer(payload, many=True).data)


@extend_schema_view(
    retrieve=extend_schema(
        tags=["Loyalty Settings"],
        summary="Cấu hình tích điểm của đại lý",
        responses={200: DealerLoyaltySettingsSerializer},
    ),
    partial_update=extend_schema(
        tags=["Loyalty Settings"],
        summary="Cập nhật cấu hình tích điểm",
        request=DealerLoyaltySettingsSerializer,
        responses={200: DealerLoyaltySettingsSerializer},
    ),
)
class DealerLoyaltySettingsViewSet(viewsets.GenericViewSet):
    permission_classes = [IsDealer]
    serializer_class = DealerLoyaltySettingsSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        dealer = _get_dealer_for_user(self.request.user)
        return get_dealer_loyalty_settings(dealer)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        return Response(self.get_serializer(obj).data)

    def partial_update(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class StorefrontLoyaltyStatusView(APIView):
    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Loyalty"],
        summary="Hạng thành viên và tiến độ tích điểm",
        responses={200: LoyaltyStatusSerializer},
    )
    def get(self, request, dealer_slug):
        profile = customer_profile_detail_queryset().get(user=request.user)
        return Response(serialize_loyalty_status(profile))


class StorefrontLoyaltyTransactionListView(APIView):
    permission_classes = [IsStorefrontCustomer]
    pagination_class = LoadMorePagination

    @extend_schema(
        tags=["Storefront Loyalty"],
        summary="Lịch sử cộng/trừ điểm của buyer",
        description=PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                LoyaltyPointTransactionSerializer,
                "PaginatedStorefrontLoyaltyTransaction",
            )
        },
    )
    def get(self, request, dealer_slug):
        profile = request.user.customer_profile
        qs = LoyaltyPointTransaction.objects.filter(customer_profile=profile).select_related("order")
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = LoyaltyPointTransactionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class DealerCustomerLoyaltyMixin:
    def _get_customer_for_dealer(self, pk, user):
        qs = customer_profile_detail_queryset().filter(user__store_dealer__isnull=False)
        if user.role == "dealer":
            qs = qs.filter(user__store_dealer=user.dealer_profile)
        return qs.get(pk=pk)


@extend_schema(tags=["Dealer Customers"])
class DealerCustomerLoyaltyTransactionsView(DealerCustomerLoyaltyMixin, APIView):
    permission_classes = [IsAdminOrDealer]

    @extend_schema(
        summary="Lịch sử điểm của khách hàng",
        description=PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                LoyaltyPointTransactionSerializer,
                "PaginatedDealerCustomerLoyaltyTransaction",
            )
        },
    )
    def get(self, request, pk):
        customer = self._get_customer_for_dealer(pk, request.user)
        qs = LoyaltyPointTransaction.objects.filter(customer_profile=customer).select_related("order")
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = LoyaltyPointTransactionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=["Dealer Customers"])
class DealerCustomerTierHistoryView(DealerCustomerLoyaltyMixin, APIView):
    permission_classes = [IsAdminOrDealer]

    @extend_schema(
        summary="Lịch sử thay đổi hạng của khách hàng",
        description=PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                CustomerTierHistorySerializer,
                "PaginatedDealerCustomerTierHistory",
            )
        },
    )
    def get(self, request, pk):
        customer = self._get_customer_for_dealer(pk, request.user)
        qs = CustomerTierHistory.objects.filter(customer_profile=customer).select_related(
            "old_tier",
            "new_tier",
        )
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = CustomerTierHistorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=["Dealer Customers"])
class DealerCustomerAdjustLoyaltyView(DealerCustomerLoyaltyMixin, APIView):
    permission_classes = [IsAdminOrDealer]

    @extend_schema(
        summary="Điều chỉnh điểm tích lũy thủ công",
        request=ManualLoyaltyAdjustSerializer,
        responses={200: LoyaltyPointTransactionSerializer},
    )
    def post(self, request, pk):
        customer = self._get_customer_for_dealer(pk, request.user)
        serializer = ManualLoyaltyAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = manual_adjust_points(
            customer,
            points=serializer.validated_data["points"],
            reason=serializer.validated_data["reason"],
            actor=request.user,
            added=serializer.validated_data["action"] == "add",
        )
        if tx is None:
            raise ValidationError({"detail": "Không thể điều chỉnh điểm."})
        customer = customer_profile_detail_queryset().get(pk=customer.pk)
        return Response(
            {
                "transaction": LoyaltyPointTransactionSerializer(tx).data,
                "loyalty": serialize_loyalty_status(customer),
            }
        )


class StorefrontLoyaltyTierListView(APIView):
    """Danh sách hạng và quyền lợi công khai trên storefront."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Storefront Loyalty"],
        summary="Danh sách hạng thành viên của cửa hàng",
        responses={200: LoyaltyTierSerializer(many=True)},
    )
    def get(self, request, dealer_slug):
        dealer = get_active_dealer_by_slug(dealer_slug)
        tiers = LoyaltyTier.objects.filter(dealer=dealer, is_active=True).order_by(
            "level",
            "min_points",
            "id",
        )
        return Response(LoyaltyTierSerializer(tiers, many=True).data)

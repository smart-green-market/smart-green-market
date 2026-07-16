"""API hồ sơ khách hàng, địa chỉ và quản lý khách theo đại lý."""

from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.marketing.segment_defaults import resolve_primary_segment_membership

from apps.accounts.models import AccountRole, AccountStatus
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.openapi_files import multipart_request
from common.permission import IsAdmin, IsAdminOrDealer
from common.pagination import LoadMorePagination
from common.status_counts import build_count_status, filter_by_status_param

from .models import CustomerAddress, CustomerProfile
from .openapi import (
    STOREFRONT_PROFILE_UPDATE_HELP,
    StorefrontCustomerProfileUpdateForm,
)
from .permissions import IsStorefrontCustomer
from .serializers import (
    CustomerAddressSerializer,
    CustomerProfileSerializer,
    CustomerProfileUpdateSerializer,
    StorefrontCustomerProfileSerializer,
)
from .customer_list_stats import (
    build_count_loyalty,
    build_count_segment,
    filter_by_primary_segment_code,
)
from .services import customer_profile_detail_queryset
from .storefront_serializers import DealerCustomerListSerializer, DealerCustomerNoteSerializer


def _customer_profile_queryset():
    return customer_profile_detail_queryset()


@extend_schema_view(
    list=extend_schema(
        tags=["Dealer Customers"],
        summary="Tệp khách hàng của đại lý",
        description="Admin xem tất cả. Dealer chỉ thấy buyer đăng ký tại cửa hàng mình. "
        "Response kèm count_status, count_loyalty, count_segment."
        + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                DealerCustomerListSerializer,
                "PaginatedDealerCustomer",
            )
        },
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo tên, email, sđt", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái tài khoản", required=False),
            OpenApiParameter("tier_code", str, description="Lọc theo mã hạng thành viên", required=False),
            OpenApiParameter("segment_code", str, description="Lọc theo mã phân khúc khách hàng (primary segment)", required=False),
        ],
    ),
    retrieve=extend_schema(tags=["Dealer Customers"], summary="Chi tiết khách hàng"),
    partial_update=extend_schema(
        tags=["Dealer Customers"],
        summary="Cập nhật ghi chú khách hàng",
        request=DealerCustomerNoteSerializer,
        responses={200: DealerCustomerListSerializer},
    ),
    update=extend_schema(tags=["Dealer Customers"], summary="Cập nhật ghi chú khách hàng"),
)
class DealerCustomerViewSet(viewsets.ModelViewSet):
    """Quản lý khách hàng đăng ký qua gian hàng đại lý."""

    http_method_names = ["get", "patch", "put", "head", "options"]
    queryset = _customer_profile_queryset().filter(user__store_dealer__isnull=False)
    serializer_class = DealerCustomerListSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "update", "partial_update", "segment_stats"):
            return [IsAdminOrDealer()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if user.role == AccountRole.DEALER:
            if not hasattr(user, "dealer_profile"):
                return qs.none()
            qs = qs.filter(user__store_dealer=user.dealer_profile)
        return qs

    def _apply_dealer_customer_list_filters(self, qs, request, *, apply_status=True):
        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(user__full_name__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__phone__icontains=search)
                | Q(user__username__icontains=search)
            )
        if apply_status:
            qs = filter_by_status_param(
                qs, request.query_params.get("status"), field="user__status"
            )
        tier_code = request.query_params.get("tier_code")
        if tier_code:
            qs = qs.filter(current_tier__code=tier_code.strip().upper())
        segment_code = request.query_params.get("segment_code")
        if segment_code:
            qs = filter_by_primary_segment_code(qs, segment_code)
        return qs

    def list(self, request, *args, **kwargs):
        base_qs = self._apply_dealer_customer_list_filters(
            self.filter_queryset(self.get_queryset()),
            request,
            apply_status=False,
        )
        count_status = build_count_status(
            base_qs, field="user__status", choices=AccountStatus
        )
        count_loyalty = build_count_loyalty(base_qs)
        count_segment = build_count_segment(base_qs)
        qs = filter_by_status_param(
            base_qs, request.query_params.get("status"), field="user__status"
        )
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(
            serializer.data,
            count_status=count_status,
            count_loyalty=count_loyalty,
            count_segment=count_segment,
        )

    @action(detail=False, methods=["get"], url_path="segment-stats")
    def segment_stats(self, request):
        qs = self.get_queryset().prefetch_related("segment_memberships__segment")
        segment_counts = {}
        for profile in qs:
            memberships = list(profile.segment_memberships.all())
            primary = resolve_primary_segment_membership(memberships)
            seg_name = primary.segment.name if primary else "Chưa phân loại"
            segment_counts[seg_name] = segment_counts.get(seg_name, 0) + 1

        data = [
            {"name": name, "count": count}
            for name, count in segment_counts.items()
        ]
        data.sort(key=lambda x: x["count"], reverse=True)
        return Response(data)

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return DealerCustomerNoteSerializer
        return DealerCustomerListSerializer

    def perform_update(self, serializer):
        if self.request.user.role == AccountRole.DEALER:
            if serializer.instance.user.store_dealer_id != self.request.user.dealer_profile.id:
                raise PermissionDenied("Không có quyền sửa khách hàng của đại lý khác.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        instance = self.get_queryset().get(pk=instance.pk)
        return Response(
            DealerCustomerListSerializer(
                instance,
                context=self.get_serializer_context(),
            ).data
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(
        tags=["Admin Customers"],
        summary="Danh sách khách hàng (Admin)",
        description=(
            "Admin xem toàn bộ khách hàng đăng ký qua các gian hàng đại lý. "
            "Response kèm count_status, count_loyalty, count_segment. "
            "Có thể lọc theo đại lý, trạng thái tài khoản, hạng thành viên, phân khúc."
        )
        + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                DealerCustomerListSerializer,
                "PaginatedAdminCustomer",
            )
        },
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo tên, email, sđt", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái tài khoản", required=False),
            OpenApiParameter("tier_code", str, description="Lọc theo mã hạng thành viên", required=False),
            OpenApiParameter("segment_code", str, description="Lọc theo mã phân khúc khách hàng (primary segment)", required=False),
            OpenApiParameter("dealer_id", int, description="Lọc theo ID đại lý", required=False),
            OpenApiParameter("dealer_slug", str, description="Lọc theo slug gian hàng đại lý", required=False),
        ],
    ),
    retrieve=extend_schema(tags=["Admin Customers"], summary="Chi tiết khách hàng (Admin)"),
    partial_update=extend_schema(
        tags=["Admin Customers"],
        summary="Cập nhật ghi chú khách hàng (Admin)",
        request=DealerCustomerNoteSerializer,
        responses={200: DealerCustomerListSerializer},
    ),
    update=extend_schema(tags=["Admin Customers"], summary="Cập nhật ghi chú khách hàng (Admin)"),
)
class AdminCustomerViewSet(DealerCustomerViewSet):
    """Admin quản lý khách hàng trên toàn hệ thống — cùng payload với dealer."""

    def get_permissions(self):
        return [IsAdmin()]

    def get_queryset(self):
        qs = self.queryset
        dealer_id = self.request.query_params.get("dealer_id")
        if dealer_id:
            qs = qs.filter(user__store_dealer_id=dealer_id)
        dealer_slug = self.request.query_params.get("dealer_slug")
        if dealer_slug:
            qs = qs.filter(user__store_dealer__slug=dealer_slug.strip())
        return qs


@extend_schema_view(
    retrieve=extend_schema(
        tags=["Storefront Customer"],
        summary="Hồ sơ buyer hiện tại",
        description=(
            "Trả hồ sơ buyer đầy đủ: `user`, `favorite_category`, `addresses[]`, "
            "`default_address`, thông tin hạng thành viên (`loyalty`), thống kê đơn hàng.\n\n"
            "Cập nhật: `PATCH /api/storefronts/{dealer_slug}/me/` (multipart, chọn file avatar)."
        ),
        responses={200: StorefrontCustomerProfileSerializer},
    ),
    partial_update=extend_schema(
        tags=["Storefront Customer"],
        summary="Cập nhật hồ sơ buyer",
        description=STOREFRONT_PROFILE_UPDATE_HELP,
        request=multipart_request(StorefrontCustomerProfileUpdateForm),
        responses={200: StorefrontCustomerProfileSerializer},
    ),
    update=extend_schema(
        tags=["Storefront Customer"],
        summary="Cập nhật hồ sơ buyer",
        description=STOREFRONT_PROFILE_UPDATE_HELP,
        request=multipart_request(StorefrontCustomerProfileUpdateForm),
        responses={200: StorefrontCustomerProfileSerializer},
    ),
)
class StorefrontCustomerProfileViewSet(viewsets.GenericViewSet):
    """Buyer xem/cập nhật hồ sơ tại gian hàng đang đăng nhập."""

    permission_classes = [IsStorefrontCustomer]
    serializer_class = StorefrontCustomerProfileSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return _customer_profile_queryset().filter(user=self.request.user)

    def get_object(self):
        return self.get_queryset().get(user=self.request.user)

    def _serialize_profile(self, profile, request):
        profile = self.get_queryset().get(pk=profile.pk)
        return StorefrontCustomerProfileSerializer(profile, context={"request": request}).data

    @extend_schema(tags=["Storefront Customer"], summary="Hồ sơ buyer hiện tại")
    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()
        return Response(self._serialize_profile(profile, request))

    def partial_update(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = CustomerProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(self._serialize_profile(profile, request))

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(
        tags=["Storefront Addresses"],
        summary="Danh sách địa chỉ buyer",
        responses={
            200: paginated_response_schema(
                CustomerAddressSerializer,
                "PaginatedStorefrontCustomerAddress",
            )
        },
    ),
    retrieve=extend_schema(tags=["Storefront Addresses"], summary="Chi tiết địa chỉ"),
    create=extend_schema(tags=["Storefront Addresses"], summary="Thêm địa chỉ nhận hàng"),
    update=extend_schema(tags=["Storefront Addresses"], summary="Cập nhật địa chỉ"),
    partial_update=extend_schema(tags=["Storefront Addresses"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Storefront Addresses"], summary="Xóa địa chỉ"),
)
class StorefrontCustomerAddressViewSet(viewsets.ModelViewSet):
    """Buyer quản lý địa chỉ trong phạm vi gian hàng đại lý."""

    permission_classes = [IsStorefrontCustomer]
    serializer_class = CustomerAddressSerializer

    def get_queryset(self):
        return CustomerAddress.objects.filter(
            customer__user=self.request.user,
        ).select_related("customer", "customer__user")

    def perform_create(self, serializer):
        try:
            profile = self.request.user.customer_profile
        except CustomerProfile.DoesNotExist as exc:
            raise ValidationError({"detail": "Chưa có hồ sơ khách hàng."}) from exc
        serializer.save(customer=profile)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        instance = self.get_queryset().get(pk=instance.pk)
        return Response(self.get_serializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

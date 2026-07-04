"""API quản lý chính sách giảm giá theo khung giờ."""

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import LoadMorePagination
from common.permission import IsAdminOrDealer, IsDealer

from .age_discount_serializers import (
    AgeDiscountPolicyDetailSerializer,
    AgeDiscountPolicyListSerializer,
    AgeDiscountPolicyWriteSerializer,
)
from .models_age_discount import AgeDiscountPolicy


def _filter_policies_for_user(qs, user):
    if user.role == "admin":
        return qs
    try:
        dealer = user.dealer_profile
    except Exception as exc:
        raise PermissionDenied("Tài khoản đại lý chưa có hồ sơ.") from exc
    return qs.filter(dealer=dealer)


@extend_schema_view(
    list=extend_schema(
        tags=["Age Discount Policies"],
        summary="Danh sách chính sách giảm theo khung giờ",
        description="Dealer chỉ thấy policy của cửa hàng mình." + PAGINATION_QUERY_HELP,
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter(
                "is_active",
                bool,
                required=False,
                description="true/false",
            ),
            OpenApiParameter("scope", str, required=False),
        ],
        responses={
            200: paginated_response_schema(
                AgeDiscountPolicyListSerializer,
                "PaginatedAgeDiscountPolicy",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Age Discount Policies"],
        summary="Chi tiết chính sách",
        responses={200: AgeDiscountPolicyDetailSerializer},
    ),
    create=extend_schema(
        tags=["Age Discount Policies"],
        summary="Tạo chính sách giảm giá",
        request=AgeDiscountPolicyWriteSerializer,
        responses={201: AgeDiscountPolicyDetailSerializer},
    ),
    partial_update=extend_schema(
        tags=["Age Discount Policies"],
        summary="Cập nhật chính sách",
        request=AgeDiscountPolicyWriteSerializer,
        responses={200: AgeDiscountPolicyDetailSerializer},
    ),
    update=extend_schema(
        tags=["Age Discount Policies"],
        summary="Cập nhật toàn bộ chính sách",
        request=AgeDiscountPolicyWriteSerializer,
        responses={200: AgeDiscountPolicyDetailSerializer},
    ),
    destroy=extend_schema(
        tags=["Age Discount Policies"],
        summary="Xóa chính sách",
    ),
)
class AgeDiscountPolicyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrDealer]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    queryset = AgeDiscountPolicy.objects.all()

    def get_queryset(self):
        qs = AgeDiscountPolicy.objects.select_related(
            "dealer",
            "category",
            "dealer_product",
        )
        qs = _filter_policies_for_user(qs, self.request.user)
        return qs.order_by("-priority", "-updated_at", "-id")

    def get_serializer_class(self):
        if self.action == "list":
            return AgeDiscountPolicyListSerializer
        if self.action in ("create", "update", "partial_update"):
            return AgeDiscountPolicyWriteSerializer
        return AgeDiscountPolicyDetailSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrDealer(), IsDealer()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(title__icontains=search)

        is_active = request.query_params.get("is_active", "").strip().lower()
        if is_active in ("true", "1", "yes"):
            qs = qs.filter(is_active=True)
        elif is_active in ("false", "0", "no"):
            qs = qs.filter(is_active=False)

        scope = request.query_params.get("scope", "").strip()
        if scope:
            qs = qs.filter(scope=scope)

        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = AgeDiscountPolicyListSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response(
            AgeDiscountPolicyDetailSerializer(instance, context={"request": request}).data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        policy = serializer.save()
        return Response(
            AgeDiscountPolicyDetailSerializer(policy, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        policy = serializer.save()
        return Response(
            AgeDiscountPolicyDetailSerializer(policy, context={"request": request}).data
        )

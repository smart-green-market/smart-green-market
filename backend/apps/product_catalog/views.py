"""API Product Master (catalog chuẩn) và Season."""

from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.response import Response

from apps.accounts.models import AccountRole
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import LoadMorePagination
from common.permission import IsAdmin, IsActive

from .models import ProductMaster, Season, SeasonStatus
from .serializers import (
    ProductMasterListSerializer,
    ProductMasterWriteSerializer,
    SeasonListSerializer,
    SeasonWriteSerializer,
)
from .services import apply_product_master_list_filters


@extend_schema_view(
    list=extend_schema(
        tags=["Product Catalog"],
        operation_id="seasons_list",
        summary="Danh sách mùa vụ",
        description="Admin: mọi trạng thái. User khác: chỉ mùa `active`." + PAGINATION_QUERY_HELP,
        responses={200: paginated_response_schema(SeasonListSerializer, "PaginatedSeason")},
    ),
    retrieve=extend_schema(
        tags=["Product Catalog"],
        operation_id="seasons_retrieve",
        summary="Chi tiết mùa vụ",
        responses={200: SeasonListSerializer},
    ),
    create=extend_schema(
        tags=["Product Catalog"],
        operation_id="seasons_create",
        summary="Admin tạo mùa vụ",
        request=SeasonWriteSerializer,
        responses={201: SeasonListSerializer},
    ),
    update=extend_schema(
        tags=["Product Catalog"],
        summary="Admin cập nhật mùa vụ",
        request=SeasonWriteSerializer,
        responses={200: SeasonListSerializer},
    ),
    partial_update=extend_schema(
        tags=["Product Catalog"],
        summary="Admin cập nhật một phần mùa vụ",
        request=SeasonWriteSerializer,
        responses={200: SeasonListSerializer},
    ),
    destroy=extend_schema(
        tags=["Product Catalog"],
        summary="Admin xóa mùa vụ",
        responses={204: None},
    ),
)
class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.order_by("sort_order", "name", "id")
    pagination_class = LoadMorePagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsActive()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SeasonWriteSerializer
        return SeasonListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", None) != AccountRole.ADMIN:
            qs = qs.filter(status=SeasonStatus.ACTIVE)
        return qs

    def list(self, request, *args, **kwargs):
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(self.filter_queryset(self.get_queryset()), request, view=self)
        data = SeasonListSerializer(page, many=True).data
        return paginator.get_paginated_response(data)


@extend_schema_view(
    list=extend_schema(
        tags=["Product Catalog"],
        operation_id="product_masters_list",
        summary="Danh sách Product Master",
        description=(
            "Catalog sản phẩm chuẩn (Product Master).\n\n"
            "**Lọc theo danh mục:** `?category_id={id}`\n\n"
            "**Lọc theo mùa:** `?season_id={id}` hoặc `?current_season=true`\n\n"
            "NCC/Dealer: chỉ master active thuộc danh mục system active."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter(name="category_id", type=int, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name="season_id", type=int, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name="current_season", type=bool, location=OpenApiParameter.QUERY, required=False),
        ],
        responses={
            200: paginated_response_schema(ProductMasterListSerializer, "PaginatedProductMaster"),
        },
    ),
    retrieve=extend_schema(
        tags=["Product Catalog"],
        operation_id="product_masters_retrieve",
        summary="Chi tiết Product Master",
        responses={200: ProductMasterListSerializer},
    ),
    create=extend_schema(
        tags=["Product Catalog"],
        operation_id="product_masters_create",
        summary="Admin tạo Product Master",
        request=ProductMasterWriteSerializer,
        responses={201: ProductMasterListSerializer},
        examples=[
            OpenApiExample(
                "Admin tạo master",
                value={
                    "category": 1,
                    "name": "Cà chua",
                    "default_unit": "kg",
                    "description": "Cà chua loại phổ thông",
                    "season_ids": [1, 2],
                    "sort_order": 0,
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(
        tags=["Product Catalog"],
        summary="Admin cập nhật Product Master",
        request=ProductMasterWriteSerializer,
        responses={200: ProductMasterListSerializer},
    ),
    partial_update=extend_schema(
        tags=["Product Catalog"],
        summary="Admin cập nhật một phần Product Master",
        request=ProductMasterWriteSerializer,
        responses={200: ProductMasterListSerializer},
    ),
    destroy=extend_schema(
        tags=["Product Catalog"],
        summary="Admin xóa Product Master",
        responses={204: None},
    ),
)
class ProductMasterViewSet(viewsets.ModelViewSet):
    queryset = ProductMaster.objects.select_related("category").prefetch_related("seasons").order_by(
        "sort_order", "name", "id"
    )
    pagination_class = LoadMorePagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsActive()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProductMasterWriteSerializer
        return ProductMasterListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        return apply_product_master_list_filters(
            qs,
            user=self.request.user,
            category_id_raw=self.request.query_params.get("category_id"),
            season_id_raw=self.request.query_params.get("season_id"),
            current_season_raw=self.request.query_params.get("current_season"),
        )

    def list(self, request, *args, **kwargs):
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(self.filter_queryset(self.get_queryset()), request, view=self)
        data = ProductMasterListSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    def _response_with_seasons(self, instance, *, status=200):
        instance = ProductMaster.objects.prefetch_related("seasons").get(pk=instance.pk)
        return Response(ProductMasterListSerializer(instance).data, status=status)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self._response_with_seasons(serializer.save(), status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        return self._response_with_seasons(serializer.save())

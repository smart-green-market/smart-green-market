"""API Product Master (catalog chuẩn)."""

from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.response import Response

from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import LoadMorePagination
from common.permission import IsAdmin, IsActive

from .models import ProductMaster
from .serializers import ProductMasterListSerializer, ProductMasterWriteSerializer
from .services import apply_product_master_list_filters


@extend_schema_view(
    list=extend_schema(
        tags=["Product Catalog"],
        operation_id="product_masters_list",
        summary="Danh sách Product Master",
        description=(
            "Catalog sản phẩm chuẩn (Product Master).\n\n"
            "**Lọc theo danh mục:** `?category_id={id}`\n\n"
            "NCC/Dealer: chỉ master active thuộc danh mục system active."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter(name="category_id", type=int, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter("search", str, description="Tìm kiếm theo tên sản phẩm, danh mục hoặc đơn vị mặc định", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái (active, inactive) - Chỉ khả dụng cho Admin", required=False),
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
    queryset = ProductMaster.objects.select_related("category").order_by(
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
            search=self.request.query_params.get("search"),
            status_param=self.request.query_params.get("status"),
        )

    def list(self, request, *args, **kwargs):
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(self.filter_queryset(self.get_queryset()), request, view=self)
        data = ProductMasterListSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    def _response_with_detail(self, instance, *, status=200):
        instance = ProductMaster.objects.select_related("category").get(pk=instance.pk)
        return Response(ProductMasterListSerializer(instance).data, status=status)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self._response_with_detail(serializer.save(), status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        return self._response_with_detail(serializer.save())

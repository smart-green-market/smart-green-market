"""API Product Master (catalog chuẩn)."""

from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets

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
            "**Lọc theo danh mục:** `?category_id={id}` — dropdown sau khi NCC chọn category system.\n\n"
            "**Toàn bộ catalog:** `GET /api/product-masters/` (không truyền `category_id`) — "
            "trả mọi master `active` (NCC/Dealer) hoặc mọi trạng thái (Admin).\n\n"
            "NCC/Dealer: chỉ master `active` thuộc danh mục system `active`."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter(
                name="category_id",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description=(
                    "Optional. ID danh mục hệ thống — lọc master theo category. "
                    "Bỏ trống để lấy toàn bộ catalog."
                ),
            ),
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
        description=(
            "Admin tự thêm sản phẩm chuẩn vào catalog. "
            "NCC **không** gửi đề xuất — dropdown thiếu món thì NCC dùng "
            "danh mục riêng (trường hợp 2) hoặc admin bổ sung master tại đây."
        ),
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
        )

    def list(self, request, *args, **kwargs):
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(self.filter_queryset(self.get_queryset()), request, view=self)
        data = ProductMasterListSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

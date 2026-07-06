"""API quản lý chính sách giảm giá theo số lượng."""

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import LoadMorePagination
from common.permission import IsAdminOrSupplier, IsSupplier

from .models_quantity_discount import QuantityDiscountPolicy
from .quantity_discount_serializers import (
    QuantityDiscountPolicyDetailSerializer,
    QuantityDiscountPolicyListSerializer,
    QuantityDiscountPolicyWriteSerializer,
)


def _filter_policies_for_user(qs, user):
    if user.role == "admin":
        return qs
    if user.role == "supplier":
        try:
            supplier = user.supplier_profile
        except Exception as exc:
            raise PermissionDenied("Tài khoản NCC chưa có hồ sơ.") from exc
        return qs.filter(supplier=supplier)
    if user.role == "dealer":
        return qs.filter(is_active=True)
    raise PermissionDenied("Không có quyền truy cập.")


@extend_schema_view(
    list=extend_schema(
        tags=["Quantity Discount Policies"],
        summary="Danh sách chính sách giảm theo số lượng",
        description=(
            "NCC chỉ thấy policy của mình. Đại lý chỉ thấy policy đang active."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter(
                "is_active",
                bool,
                required=False,
                description="true/false",
            ),
            OpenApiParameter("scope", str, required=False),
            OpenApiParameter(
                "supplier_product_id",
                int,
                required=False,
                description="Lọc policy áp dụng cho sản phẩm",
            ),
        ],
        responses={
            200: paginated_response_schema(
                QuantityDiscountPolicyListSerializer,
                "PaginatedQuantityDiscountPolicy",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Quantity Discount Policies"],
        summary="Chi tiết chính sách",
        responses={200: QuantityDiscountPolicyDetailSerializer},
    ),
    create=extend_schema(
        tags=["Quantity Discount Policies"],
        summary="Tạo chính sách giảm giá theo số lượng",
        request=QuantityDiscountPolicyWriteSerializer,
        responses={201: QuantityDiscountPolicyDetailSerializer},
    ),
    partial_update=extend_schema(
        tags=["Quantity Discount Policies"],
        summary="Cập nhật chính sách",
        request=QuantityDiscountPolicyWriteSerializer,
        responses={200: QuantityDiscountPolicyDetailSerializer},
    ),
    update=extend_schema(
        tags=["Quantity Discount Policies"],
        summary="Cập nhật toàn bộ chính sách",
        request=QuantityDiscountPolicyWriteSerializer,
        responses={200: QuantityDiscountPolicyDetailSerializer},
    ),
    destroy=extend_schema(
        tags=["Quantity Discount Policies"],
        summary="Xóa chính sách",
    ),
)
class QuantityDiscountPolicyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSupplier]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    queryset = QuantityDiscountPolicy.objects.all()

    def get_queryset(self):
        qs = QuantityDiscountPolicy.objects.select_related(
            "supplier",
            "category",
            "supplier_product",
        ).prefetch_related("tiers")
        qs = _filter_policies_for_user(qs, self.request.user)
        return qs.order_by("-priority", "-updated_at", "-id")

    def get_serializer_class(self):
        if self.action == "list":
            return QuantityDiscountPolicyListSerializer
        if self.action in ("create", "update", "partial_update"):
            return QuantityDiscountPolicyWriteSerializer
        return QuantityDiscountPolicyDetailSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrSupplier(), IsSupplier()]
        return super().get_permissions()

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

        supplier_product_id = request.query_params.get("supplier_product_id", "").strip()
        if supplier_product_id.isdigit():
            from .models import SupplierProduct

            try:
                product = SupplierProduct.objects.get(pk=int(supplier_product_id))
            except SupplierProduct.DoesNotExist:
                qs = qs.none()
            else:
                from .quantity_discount import _active_policies_for_product

                policy_ids = [p.id for p in _active_policies_for_product(product)]
                qs = qs.filter(id__in=policy_ids)

        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = QuantityDiscountPolicyListSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response(
            QuantityDiscountPolicyDetailSerializer(
                instance,
                context={"request": request},
            ).data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        policy = serializer.save()
        return Response(
            QuantityDiscountPolicyDetailSerializer(
                policy,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        policy = serializer.save()
        return Response(
            QuantityDiscountPolicyDetailSerializer(
                policy,
                context={"request": request},
            ).data
        )

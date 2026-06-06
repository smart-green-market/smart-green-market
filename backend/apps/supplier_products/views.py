from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from common.permission import IsActive
from .models import SupplierProduct, SupplierProductImage, CultivationProcess
from .serializer import (
    SupplierProductSerializer,
    SupplierProductImageSerializer,
    CultivationProcessSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Products"],
        summary="Danh sách sản phẩm",
        description="Lấy danh sách sản phẩm supplier. Bao gồm nested `images`.",
        responses={200: SupplierProductSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Supplier Products"],
        summary="Chi tiết sản phẩm",
        responses={200: SupplierProductSerializer},
    ),
    create=extend_schema(
        tags=["Supplier Products"],
        summary="Tạo sản phẩm mới",
        description=(
            "Chỉ **supplier đã được duyệt** (`verification_status=approved`).\n"
            "Sản phẩm mới có `status=pending`, chờ admin duyệt.\n"
            "`supplier` tự gắn theo JWT."
        ),
        request=SupplierProductSerializer,
        responses={201: SupplierProductSerializer},
    ),
    update=extend_schema(tags=["Supplier Products"], summary="Cập nhật toàn bộ sản phẩm"),
    partial_update=extend_schema(tags=["Supplier Products"], summary="Cập nhật một phần sản phẩm"),
    destroy=extend_schema(tags=["Supplier Products"], summary="Xóa sản phẩm"),
)
class SupplierProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    queryset = SupplierProduct.objects.select_related(
        "supplier", "category", "verified_by"
    ).prefetch_related("images")
    serializer_class = SupplierProductSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Product Images"],
        summary="Danh sách ảnh sản phẩm",
        responses={200: SupplierProductImageSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Supplier Product Images"],
        summary="Chi tiết ảnh",
        responses={200: SupplierProductImageSerializer},
    ),
    create=extend_schema(
        tags=["Supplier Product Images"],
        summary="Thêm ảnh sản phẩm",
        description=(
            "Supplier chỉ thêm ảnh cho sản phẩm thuộc profile của mình.\n"
            "Đặt `is_thumbnail=true` để chọn ảnh đại diện (tự bỏ thumbnail cũ)."
        ),
        request=SupplierProductImageSerializer,
        responses={201: SupplierProductImageSerializer},
    ),
    update=extend_schema(tags=["Supplier Product Images"], summary="Cập nhật ảnh"),
    partial_update=extend_schema(tags=["Supplier Product Images"], summary="Cập nhật một phần ảnh"),
    destroy=extend_schema(tags=["Supplier Product Images"], summary="Xóa ảnh"),
)
class SupplierProductImageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    queryset = SupplierProductImage.objects.select_related(
        "supplier_product__supplier"
    )
    serializer_class = SupplierProductImageSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Cultivation Processes"],
        summary="Danh sách quy trình canh tác",
        description="Các bước quy trình sản xuất của sản phẩm, sắp xếp theo `step_order`.",
        responses={200: CultivationProcessSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Cultivation Processes"],
        summary="Chi tiết bước quy trình",
        responses={200: CultivationProcessSerializer},
    ),
    create=extend_schema(
        tags=["Cultivation Processes"],
        summary="Thêm bước quy trình",
        description=(
            "Mỗi sản phẩm có `step_order` unique. "
            "Supplier chỉ thao tác quy trình của sản phẩm thuộc mình."
        ),
        request=CultivationProcessSerializer,
        responses={201: CultivationProcessSerializer},
    ),
    update=extend_schema(tags=["Cultivation Processes"], summary="Cập nhật bước quy trình"),
    partial_update=extend_schema(tags=["Cultivation Processes"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Cultivation Processes"], summary="Xóa bước quy trình"),
)
class CultivationProcessViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    queryset = CultivationProcess.objects.select_related(
        "supplier_product__supplier"
    )
    serializer_class = CultivationProcessSerializer

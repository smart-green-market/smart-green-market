from rest_framework import viewsets
from .models import Category
from .serializers import CategorySerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
from common.permission import IsActive

@extend_schema_view(
    list=extend_schema(
        tags=["Categories"],
        summary="Danh sách danh mục",
        description="Lấy toàn bộ categories. Yêu cầu tài khoản `status=active`.",
    ),
    retrieve=extend_schema(
        tags=["Categories"],
        summary="Chi tiết danh mục",
        description="Lấy thông tin 1 category theo id.",
    ),
    create=extend_schema(
        tags=["Categories"],
        summary="Tạo danh mục",
        description="Tạo category mới. `created_by` tự gắn theo user đăng nhập.",
    ),
    update=extend_schema(
        tags=["Categories"],
        summary="Cập nhật toàn bộ danh mục",
    ),
    partial_update=extend_schema(
        tags=["Categories"],
        summary="Cập nhật một phần danh mục",
    ),
    destroy=extend_schema(
        tags=["Categories"],
        summary="Xóa danh mục",
        description="Xóa category. Sản phẩm đang dùng category này sẽ bị chặn bởi PROTECT.",
    ),
)
class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsActive]
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

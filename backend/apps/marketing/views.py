from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.accounts.models import AccountRole
from common.permission import IsActive, IsAdminOrDealer
from common.querysets import ORDER_NEWEST, is_admin
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema

from .models import CustomerSegment
from .serializers import CustomerSegmentSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Customer Segments"],
        summary="Danh sách nhóm khách hàng (Phân trang)",
        description="Admin và Dealer xem tất cả nhóm khách hàng (segment hệ thống dùng chung)." + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(
                CustomerSegmentSerializer,
                "PaginatedCustomerSegmentList",
            )
        },
    ),
    retrieve=extend_schema(tags=["Customer Segments"], summary="Chi tiết nhóm khách hàng"),
    create=extend_schema(tags=["Customer Segments"], summary="Tạo nhóm khách hàng mới"),
    update=extend_schema(tags=["Customer Segments"], summary="Cập nhật nhóm khách hàng"),
    partial_update=extend_schema(tags=["Customer Segments"], summary="Cập nhật một phần nhóm khách hàng"),
    destroy=extend_schema(tags=["Customer Segments"], summary="Xóa nhóm khách hàng"),
)
class CustomerSegmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet để quản lý phân nhóm khách hàng (CustomerSegment).
    Segment là tài nguyên dùng chung toàn hệ thống; membership gán qua CustomerSegmentMember.
    """
    permission_classes = [IsActive, IsAdminOrDealer]
    queryset = CustomerSegment.objects.all()
    serializer_class = CustomerSegmentSerializer

    def get_queryset(self):
        user = self.request.user
        if is_admin(user) or user.role == AccountRole.DEALER:
            return self.queryset.order_by(*ORDER_NEWEST)
        return self.queryset.none()

    def perform_update(self, serializer):
        if serializer.instance.is_system:
            raise PermissionDenied("Không thể sửa nhóm khách hàng hệ thống.")
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionDenied("Không thể xóa nhóm khách hàng hệ thống.")
        super().perform_destroy(instance)

from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.permission import IsActive, IsAdminOrDealer
from common.querysets import filter_admin_or_dealer_account
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema

from .models import CustomerSegment
from .serializers import CustomerSegmentSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Customer Segments"],
        summary="Danh sách nhóm khách hàng (Phân trang)",
        description="Admin xem tất cả. Dealer chỉ thấy nhóm khách hàng của mình." + PAGINATION_QUERY_HELP,
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
    Admin có toàn quyền.
    Dealer chỉ thao tác trên các phân nhóm thuộc tài khoản của mình.
    """
    permission_classes = [IsActive, IsAdminOrDealer]
    queryset = CustomerSegment.objects.select_related("dealer", "dealer__account")
    serializer_class = CustomerSegmentSerializer

    def get_queryset(self):
        return filter_admin_or_dealer_account(
            self.queryset,
            self.request.user,
            account_lookup="dealer__account",
        )

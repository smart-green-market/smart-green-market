"""API tài chính nhà cung cấp — chỉ admin."""

from decimal import Decimal

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import paginate_queryset
from common.permission import IsAdmin
from common.status_counts import normalize_supplier_verification_status

from .finance_serializers import (
    SupplierFinanceItemSerializer,
    SupplierFinanceOverviewSerializer,
)
from .finance_services import (
    _build_metrics_lookup,
    build_finance_list_queryset,
    build_finance_overview,
    serialize_supplier_finance,
)


def _finance_query_params(request):
    return {
        "search": request.query_params.get("search"),
        "verification_status": normalize_supplier_verification_status(
            request.query_params.get("verification_status")
        ),
    }


class AdminSupplierFinanceOverviewView(APIView):
    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Suppliers"],
        summary="Tổng quan tài chính nhà cung cấp (Admin)",
        description=(
            "Thống kê doanh thu và dòng tiền toàn hệ thống theo bộ lọc.\n"
            "Hỗ trợ `search` (tên công ty, MST) và `verification_status`."
        ),
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter(
                "verification_status",
                str,
                required=False,
                description="pending | approved | rejected",
            ),
        ],
        responses={200: SupplierFinanceOverviewSerializer},
    )
    def get(self, request):
        data = build_finance_overview(**_finance_query_params(request))
        return Response(SupplierFinanceOverviewSerializer(data).data)


class AdminSupplierFinanceListView(APIView):
    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Suppliers"],
        summary="Danh sách tài chính theo nhà cung cấp (Admin)",
        description=(
            "Phân trang danh sách NCC kèm doanh thu, tiền vào/ra và "
            "xu hướng dòng tiền 6 tháng.\n"
            "Hỗ trợ `search`, `verification_status`, `page`, `page_size`."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter(
                "verification_status",
                str,
                required=False,
                description="pending | approved | rejected",
            ),
        ],
        responses={
            200: paginated_response_schema(
                SupplierFinanceItemSerializer,
                "PaginatedSupplierFinance",
            ),
        },
    )
    def get(self, request):
        suppliers_qs = build_finance_list_queryset(**_finance_query_params(request))

        def serialize(page):
            supplier_ids = [supplier.id for supplier in page]
            metrics_lookup = _build_metrics_lookup(supplier_ids)
            empty_metrics = {
                "total_revenue": Decimal("0"),
                "cash_in": Decimal("0"),
                "cash_out": Decimal("0"),
                "order_count": 0,
            }
            return [
                serialize_supplier_finance(
                    supplier,
                    metrics_lookup.get(supplier.id, empty_metrics),
                )
                for supplier in page
            ]

        return paginate_queryset(self, request, suppliers_qs, serialize)

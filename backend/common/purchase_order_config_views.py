"""API cấu hình phiếu nhập — UI dealer/NCC đọc giới hạn trước khi tạo đơn."""

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.purchase_orders.openapi import PO_CONFIG_DESCRIPTION

PurchaseOrderConfigSerializer = inline_serializer(
    name="PurchaseOrderConfig",
    fields={
        "min_order_amount": serializers.IntegerField(
            help_text="Tổng tiền đơn tối thiểu (VND)",
        ),
        "max_order_amount": serializers.IntegerField(
            help_text="Tổng tiền đơn tối đa (VND)",
        ),
        "min_deposit_percent": serializers.IntegerField(
            help_text="Tỷ lệ cọc tối thiểu (%) — NCC xác nhận đơn",
        ),
        "max_deposit_percent": serializers.IntegerField(
            help_text="Tỷ lệ cọc tối đa (%)",
        ),
        "min_delivery_lead_days": serializers.IntegerField(
            help_text="Số ngày tối thiểu từ lúc đặt đến thời gian giao mong muốn",
        ),
        "default_deposit_percent": serializers.IntegerField(
            help_text="Tỷ lệ cọc mặc định (%) nếu NCC không nhập",
        ),
    },
)


class PurchaseOrderConfigView(APIView):
    """Giới hạn phiếu nhập — không cần auth (giống GET /api/banks/)."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Purchase Orders"],
        summary="[Bước 0] Cấu hình phiếu nhập",
        description=PO_CONFIG_DESCRIPTION,
        responses={200: PurchaseOrderConfigSerializer},
    )
    def get(self, request):
        return Response(get_purchase_order_config())

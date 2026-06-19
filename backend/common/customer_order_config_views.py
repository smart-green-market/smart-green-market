"""API cấu hình đơn buyer B2C — UI storefront đọc trước checkout."""

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.business_rules import get_customer_order_config

DeliverySlotDefinitionConfigSerializer = inline_serializer(
    name="CustomerOrderDeliverySlotDefinition",
    fields={
        "id": serializers.CharField(),
        "name": serializers.CharField(),
        "start_time": serializers.CharField(),
        "end_time": serializers.CharField(),
    },
)

CustomerOrderConfigSerializer = inline_serializer(
    name="CustomerOrderConfig",
    fields={
        "shipping_fee": serializers.IntegerField(
            help_text="Phí giao hàng cố định (VND)",
        ),
        "payment_type": serializers.CharField(
            help_text="Loại thanh toán phase 1: cod",
        ),
        "timezone": serializers.CharField(
            help_text="Múi giờ nghiệp vụ khung giờ giao",
        ),
        "min_lead_hours": serializers.IntegerField(
            help_text="Lead time tối thiểu (giờ) trước slot",
        ),
        "morning_cutoff_hour": serializers.IntegerField(
            help_text="Từ giờ này không đặt slot sáng ngày mai",
        ),
        "max_booking_days": serializers.IntegerField(
            help_text="Số ngày lịch cho phép đặt (hôm nay + ngày mai = 2)",
        ),
        "slots": serializers.ListField(
            child=DeliverySlotDefinitionConfigSerializer,
            help_text="Định nghĩa slot Sáng/Chiều",
        ),
    },
)


class CustomerOrderConfigView(APIView):
    """Giới hạn đơn buyer — không cần auth."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Orders"],
        operation_id="customer_order_config",
        summary="Cấu hình đơn hàng buyer (B2C)",
        description=(
            "Trả phí ship, COD và quy tắc khung giờ giao rau.\n\n"
            "UI checkout: đọc config tĩnh; slot khả dụng theo thời điểm gọi "
            "`GET /api/storefronts/{dealer_slug}/delivery-slots/`.\n\n"
            "Không dùng `min_delivery_lead_days` (rule phiếu nhập NCC)."
        ),
        responses={200: CustomerOrderConfigSerializer},
        auth=[],
    )
    def get(self, request):
        return Response(get_customer_order_config())

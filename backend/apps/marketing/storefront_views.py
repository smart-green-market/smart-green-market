"""API ghi nhận tương tác buyer trên storefront."""

from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStorefrontCustomer
from apps.customers.services import get_active_dealer_by_slug

from . import services
from .serializers import InteractionTrackResponseSerializer, InteractionTrackSerializer


def _get_dealer_or_404(dealer_slug):
    try:
        return get_active_dealer_by_slug(dealer_slug)
    except Exception as exc:
        raise NotFound("Gian hàng không tồn tại hoặc chưa hoạt động.") from exc


def _serialize_result(result: services.InteractionTrackResult) -> dict:
    return InteractionTrackResponseSerializer(
        {
            "recorded": result.recorded,
            "action": result.action,
            "reason": result.reason,
            "retry_after_seconds": result.retry_after_seconds,
            "view_count": result.view_count,
            "add_cart_count": result.add_cart_count,
            "purchase_count": result.purchase_count,
            "engagement_score": result.engagement_score,
        }
    ).data


class StorefrontInteractionTrackView(APIView):
    """Ghi nhận xem SP hoặc thêm giỏ — buyer đã đăng nhập."""

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Interactions"],
        operation_id="storefront_interactions_track",
        summary="Ghi nhận tương tác sản phẩm",
        description=(
            "Buyer ghi nhận **view** (+2 điểm, debounce 5 phút/SP) hoặc **add_cart** "
            "(+3 điểm, tối đa 1 lần/SP). **purchase** (+5) tự ghi khi `POST .../orders/` thành công.\n\n"
            "Điểm quan tâm: `engagement_score = view_count×2 + add_cart_count×3 + purchase_count×5`."
        ),
        request=InteractionTrackSerializer,
        responses={200: InteractionTrackResponseSerializer},
        examples=[
            OpenApiExample(
                "Xem chi tiết sản phẩm",
                value={"dealer_product_id": 12, "action": "view"},
                request_only=True,
            ),
            OpenApiExample(
                "Thêm giỏ lần đầu",
                value={"dealer_product_id": 12, "action": "add_cart"},
                request_only=True,
            ),
            OpenApiExample(
                "Đã ghi nhận view",
                value={
                    "recorded": True,
                    "action": "view",
                    "reason": None,
                    "retry_after_seconds": None,
                    "view_count": 1,
                    "add_cart_count": 0,
                    "purchase_count": 0,
                    "engagement_score": 2,
                },
                response_only=True,
            ),
            OpenApiExample(
                "View bị debounce",
                value={
                    "recorded": False,
                    "action": "view",
                    "reason": "view_debounced",
                    "retry_after_seconds": 142,
                    "view_count": 1,
                    "add_cart_count": 0,
                    "purchase_count": 0,
                    "engagement_score": 2,
                },
                response_only=True,
            ),
        ],
    )
    def post(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        serializer = InteractionTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = services.track_interaction(
            customer=request.user.customer_profile,
            dealer=dealer,
            dealer_product_id=serializer.validated_data["dealer_product_id"],
            action=serializer.validated_data["action"],
        )
        return Response(_serialize_result(result))

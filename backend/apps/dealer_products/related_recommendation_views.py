"""API dealer xem danh sách gợi ý sản phẩm liên quan."""

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.permission import IsActive, IsAdminOrDealer

from .models import DealerProduct
from .related_recommendation_serializers import DealerProductRelatedRecommendationSerializer
from .related_recommendation_services import (
    get_dealer_related_recommendations_qs,
    get_related_recommendation_record,
)
from .views import _filter_dealer_product_scope


@extend_schema_view(
    list=extend_schema(
        tags=["Dealer Product Recommendations"],
        summary="Danh sách gợi ý sản phẩm liên quan",
        description=(
            "Admin xem tất cả. Dealer chỉ thấy gợi ý của sản phẩm thuộc gian hàng mình."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter(
                name="dealer_product",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Lọc theo ID sản phẩm đại lý",
            ),
        ],
        responses={
            200: paginated_response_schema(
                DealerProductRelatedRecommendationSerializer,
                "PaginatedDealerProductRelatedRecommendation",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Dealer Product Recommendations"],
        summary="Chi tiết gợi ý sản phẩm liên quan",
        responses={200: DealerProductRelatedRecommendationSerializer},
    ),
)
class DealerProductRelatedRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DealerProductRelatedRecommendationSerializer
    permission_classes = [IsAuthenticated, IsActive, IsAdminOrDealer]

    def get_queryset(self):
        qs = get_dealer_related_recommendations_qs(self.request.user)
        dealer_product_id = self.request.query_params.get("dealer_product")
        if dealer_product_id:
            qs = qs.filter(dealer_product_id=dealer_product_id)
        return qs


class DealerProductRelatedRecommendationByProductView(APIView):
    """Gợi ý liên quan của một sản phẩm đại lý — trả rỗng nếu chưa cấu hình."""

    permission_classes = [IsAuthenticated, IsActive, IsAdminOrDealer]

    @extend_schema(
        tags=["Dealer Product Recommendations"],
        summary="Gợi ý liên quan theo sản phẩm đại lý",
        description=(
            "Trả `related_product_ids` và `updated_at` của sản phẩm. "
            "Nếu chưa có bản ghi cache — trả list rỗng và `updated_at` null."
        ),
        responses={200: DealerProductRelatedRecommendationSerializer},
    )
    def get(self, request, product_id):
        product = _filter_dealer_product_scope(
            DealerProduct.objects.all(),
            request.user,
        ).filter(pk=product_id).first()
        if product is None:
            raise NotFound("Sản phẩm không tồn tại hoặc bạn không có quyền truy cập.")

        record = get_related_recommendation_record(product)
        if record is None:
            return Response(
                {
                    "id": None,
                    "dealer_product_id": product.id,
                    "dealer_product_title": product.title,
                    "related_product_ids": [],
                    "updated_at": None,
                }
            )

        return Response(
            DealerProductRelatedRecommendationSerializer(record).data
        )

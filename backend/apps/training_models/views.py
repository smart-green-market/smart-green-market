from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from apps.accounts.models import AccountRole
from apps.training_models.services import RelatedProductRecommendationService, CustomerSegmentationService
from common.permission import IsAdmin, IsAdminOrDealer

import logging
logger = logging.getLogger(__name__)

def index(request):
    #df_labeled, label_mapping = customer_segmentation.CustomerSegmentationService().execute_pipeline(dealer_id=10, t_days=30)
    #print(f"Label Mapping: {label_mapping}")
    #print(f"Clustered DataFrame:\n{df_labeled.head(20)}")
    #print(f"mapping: {label_mapping}")
    #return HttpResponse(f"Customer Metrics:")
    return HttpResponse(f"AI index")

class CustomerSegmentationRequestSerializer(serializers.Serializer):
    dealer_id = serializers.IntegerField(min_value=1, help_text="ID đại lý cần phân khúc khách hàng")
    t_days = serializers.IntegerField(min_value=1, help_text="Số ngày lấy dữ liệu đơn hàng để phân tích")


@extend_schema(
    tags=["AI Training"],
    summary="Chạy phân khúc khách hàng (RFM + K-Means)",
    description=(
        "Nhận `dealer_id` và `t_days` từ frontend, gọi pipeline AI phân khúc khách hàng "
        "và lưu kết quả xuống database."
    ),
    request=CustomerSegmentationRequestSerializer,
    responses={
        200: inline_serializer(
            name="CustomerSegmentationSuccessResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
                "customer_count": serializers.IntegerField(required=False),
            },
        ),
        400: inline_serializer(
            name="CustomerSegmentationFailureResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
    },
)
class CustomerSegmentationView(APIView):
    """API POST chạy pipeline phân khúc khách hàng cho một đại lý."""

    permission_classes = [IsAuthenticated, IsAdminOrDealer]

    def post(self, request):
        serializer = CustomerSegmentationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dealer_id = serializer.validated_data["dealer_id"]
        t_days = serializer.validated_data["t_days"]

        if request.user.role == AccountRole.DEALER:
            dealer_profile = getattr(request.user, "dealer_profile", None)
            if dealer_profile is None:
                raise PermissionDenied("Tài khoản đại lý chưa có hồ sơ.")
            if dealer_id != dealer_profile.id:
                raise PermissionDenied("Không có quyền chạy phân khúc cho đại lý khác.")

        try:
            df_labeled, label_mapping = CustomerSegmentationService().execute_pipeline(
                dealer_id=dealer_id,
                t_days=t_days,
            )
        except Exception as exc:
            logger.exception(
                "Customer segmentation failed for dealer_id=%s, t_days=%s",
                dealer_id,
                t_days,
            )
            return Response(
                {
                    "success": False,
                    "message": f"Phân khúc khách hàng thất bại: {exc}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if df_labeled is None:
            return Response(
                {
                    "success": False,
                    "message": label_mapping,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": f"Phân khúc khách hàng thành công cho {len(df_labeled)} khách hàng.",
                "customer_count": len(df_labeled),
            },
            status=status.HTTP_200_OK,
        )

customer_segmentation = CustomerSegmentationView.as_view()


@extend_schema(
    tags=["AI Training"],
    summary="Huấn luyện gợi ý sản phẩm mua kèm (Item2Vec)",
    description=(
        "Chỉ admin. Chạy pipeline huấn luyện mô hình gợi ý sản phẩm liên quan "
        "từ lịch sử đơn hàng và cập nhật kết quả xuống database."
    ),
    request=None,
    responses={
        200: inline_serializer(
            name="RelatedProductRecommendationSuccessResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
        400: inline_serializer(
            name="RelatedProductRecommendationFailureResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
    },
)
class RelatedProductRecommendationView(APIView):
    """API POST huấn luyện pipeline gợi ý sản phẩm mua kèm — chỉ admin."""

    permission_classes = [IsAdmin]

    def post(self, request):
        try:
            success, message = RelatedProductRecommendationService().execute_pipeline()
        except Exception as exc:
            logger.exception("Related product recommendation training failed")
            return Response(
                {
                    "success": False,
                    "message": f"Huấn luyện gợi ý sản phẩm thất bại: {exc}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not success:
            return Response(
                {
                    "success": False,
                    "message": message,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": message,
            },
            status=status.HTTP_200_OK,
        )


train_related_products = RelatedProductRecommendationView.as_view()

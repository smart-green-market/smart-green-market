from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from apps.accounts.models import AccountRole
from apps.training_models.services import RelatedProductRecommendationService, CustomerSegmentationService, TrendAndDecisionRecommendationService
from common.permission import IsAdmin, IsAdminOrDealer
from .models import ProductPredictionResult
from .serializers import ProductPredictionResultSerializer

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


class DealerAnalysisView(APIView):
    """
    API 1: Tiến hành phân tích chuỗi thời gian (LSTM) & Cập nhật cơ sở dữ liệu dự báo.
    Yêu cầu: Đã đăng nhập (Auth). Nhận dealer_id từ body request.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["AI Training"],
        summary="Chạy phân tích AI dự báo xu thế cho Đại lý (LSTM)",
        description=(
            "Kích hoạt pipeline AI dự báo xu thế và quyết định kinh doanh cho một đại lý cụ thể. "
            "Hệ thống sẽ chạy mô hình học máy và lưu kết quả xuống database."
        ),
        request=inline_serializer(
            name="DealerAnalysisRequest",
            fields={
                "dealer_id": serializers.IntegerField(help_text="ID của đại lý cần phân tích")
            }
        ),
        responses={
            200: inline_serializer(
                name="DealerAnalysisSuccessResponse",
                fields={
                    "message": serializers.CharField(),
                    "dealer_id": serializers.IntegerField(),
                    "total_items": serializers.IntegerField(),
                    "results": ProductPredictionResultSerializer(many=True),
                },
            ),
            400: inline_serializer(
                name="DealerAnalysisBadRequestResponse",
                fields={"error": serializers.CharField()},
            ),
            500: inline_serializer(
                name="DealerAnalysisErrorResponse",
                fields={"error": serializers.CharField()},
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        # Lấy dealer_id từ request body thay vì từ User Profile
        dealer_id = request.data.get('dealer_id')
        
        if not dealer_id:
            return Response(
                {"error": "Vui lòng cung cấp 'dealer_id' trong payload request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kích hoạt pipeline AI
        ai_service = TrendAndDecisionRecommendationService()
        success, message = ai_service.execute_pipeline(dealer_id=int(dealer_id))

        if not success:
            return Response({"error": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Lấy dữ liệu mới nhất
        analysis_data = ProductPredictionResult.objects.filter(dealer_id=dealer_id).order_by('-growth_rate')
        serializer = ProductPredictionResultSerializer(analysis_data, many=True)

        return Response({
            "message": "Phân tích dữ liệu bằng AI thành công.",
            "dealer_id": dealer_id,
            "total_items": analysis_data.count(),
            "results": serializer.data
        }, status=status.HTTP_200_OK)

product_prediction_results = DealerAnalysisView.as_view()


class DealerRecommendationView(APIView):
    """
    API 2: Trả về danh sách gợi ý quyết định kinh doanh dựa trên kết quả phân tích gần nhất.
    Yêu cầu: Đã đăng nhập (Auth). Nhận dealer_id từ query parameters.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["AI Training"],
        summary="Lấy danh sách gợi ý quyết định kinh doanh",
        description=(
            "Trả về danh sách các sản phẩm kèm theo quyết định kinh doanh đã được AI phân tích từ trước. "
            "Bắt buộc truyền dealer_id. Có thể lọc thêm theo loại quyết định hoặc danh mục."
        ),
        parameters=[
            OpenApiParameter(
                name="dealer_id", 
                description="ID của đại lý cần xem dữ liệu", 
                required=True, 
                type=OpenApiTypes.INT
            ),
            OpenApiParameter(
                name="decision_type", 
                description="Lọc theo quyết định (VD: Nhập hàng gấp, Duy trì...)", 
                required=False, 
                type=OpenApiTypes.STR
            ),
            OpenApiParameter(
                name="category", 
                description="Lọc theo danh mục sản phẩm (VD: Rau_cu)", 
                required=False, 
                type=OpenApiTypes.STR
            ),
        ],
        responses={
            200: inline_serializer(
                name="DealerRecommendationSuccessResponse",
                fields={
                    "summary_kpi": serializers.DictField(child=serializers.IntegerField()),
                    "recommendations": ProductPredictionResultSerializer(many=True),
                },
            ),
            400: inline_serializer(
                name="DealerRecommendationErrorResponse",
                fields={"error": serializers.CharField()},
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        # Lấy dealer_id từ query parameter
        dealer_id = request.query_params.get('dealer_id')
        
        if not dealer_id:
            return Response(
                {"error": "Vui lòng cung cấp 'dealer_id' trên URL (ví dụ: ?dealer_id=1)."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = ProductPredictionResult.objects.filter(dealer_id=dealer_id)

        decision_filter = request.query_params.get('decision_type', None)
        category_filter = request.query_params.get('category', None)

        if decision_filter:
            queryset = queryset.filter(decision__iexact=decision_filter)
        if category_filter:
            queryset = queryset.filter(category__iexact=category_filter)

        queryset = queryset.order_by('decision', '-decision_confidence')

        summary_stats = {
            "nhap_hang_gap": queryset.filter(decision="Nhập hàng gấp").count(),
            "nhap_them": queryset.filter(decision="Nhập thêm hàng").count(),
            "duy_tri": queryset.filter(decision="Duy trì").count(),
            "khuyen_mai": queryset.filter(decision="Khuyến mãi đẩy hàng").count(),
            "giam_nhap": queryset.filter(decision="Giảm nhập / ngừng nhập").count(),
        }

        serializer = ProductPredictionResultSerializer(queryset, many=True)
        
        return Response({
            "summary_kpi": summary_stats,
            "recommendations": serializer.data
        }, status=status.HTTP_200_OK)

trend_and_decision_recommendation = DealerRecommendationView.as_view()
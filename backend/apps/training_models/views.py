from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta

from apps.accounts.models import AccountRole
from apps.training_models.services import RelatedProductRecommendationService, CustomerSegmentationService, TrendAndDecisionRecommendationService
from apps.marketing.models import CustomerSegmentationHistory
from apps.marketing.serializers import DealerSegmentationHistorySerializer, AdminSegmentationHistorySerializer
from common.permission import IsAdmin, IsAdminOrDealer
from common.pagination import LoadMorePagination
from common.openapi import paginated_response_schema
from .models import ProductPredictionResult, AITrainingHistory
from .serializers import (
    ProductPredictionResultSerializer, 
    AITrainingHistorySerializer, 
    AITrainingHistorySummarySerializer
)

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
    tags=["AI Segmentation"],
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
                "segment_counts": serializers.DictField(child=serializers.IntegerField(), required=False), # Thêm lại vào docs
                "silhouette_score": serializers.FloatField(required=False),
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

        service = CustomerSegmentationService()

        try:
            df_labeled, label_mapping = service.execute_pipeline(
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

        silhouette_score = service.last_silhouette_score
        
        segment_counts = df_labeled['Customer_Tag_Code'].value_counts().to_dict()

        return Response(
            {
                "success": True,
                "message": f"Phân khúc khách hàng thành công cho {len(df_labeled)} khách hàng.",
                "customer_count": len(df_labeled),
                "segment_counts": segment_counts, # Trả về kèm cấu trúc số lượng nhóm
                "silhouette_score": round(silhouette_score, 4),
            },
            status=status.HTTP_200_OK,
        )

customer_segmentation = CustomerSegmentationView.as_view()

class DealerSegmentationHistoryView(APIView):
    """API GET lấy lịch sử phân khúc của 1 đại lý trong vòng 60 ngày gần nhất."""
    permission_classes = [IsAuthenticated, IsAdminOrDealer]

    @extend_schema(
        tags=["AI Segmentation"],
        summary="Lấy lịch sử phân khúc trong 60 ngày gần nhất của Đại lý",
        description="Trả về toàn bộ các phiên phân cụm AI trong vòng 60 ngày qua, sắp xếp tuần tự tăng dần phục vụ vẽ biểu đồ miền.",
        parameters=[
            OpenApiParameter("dealer_id", OpenApiTypes.INT, required=True, description="ID của đại lý cần lấy lịch sử")
        ],
        responses={200: DealerSegmentationHistorySerializer(many=True)}
    )
    def get(self, request):
        dealer_id = request.query_params.get("dealer_id")
        if not dealer_id:
            return Response({"error": "Vui lòng cung cấp tham số 'dealer_id'."}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra bảo mật vai trò: Đại lý chỉ được xem dữ liệu của chính mình
        if request.user.role == AccountRole.DEALER:
            dealer_profile = getattr(request.user, "dealer_profile", None)
            if dealer_profile is None or int(dealer_id) != dealer_profile.id:
                raise PermissionDenied("Bạn không có quyền xem lịch sử phân khúc của đại lý khác.")

        # ĐIỀU CHỈNH: Tính toán mốc thời gian 60 ngày gần nhất
        start_date = timezone.now() - timedelta(days=60)

        # Lấy lịch sử và sắp xếp tăng dần ('created_at') từ CŨ đến MỚI 
        # giúp Frontend đưa thẳng dữ liệu vào trục X biểu đồ miền mà không cần đảo mảng
        history_list = CustomerSegmentationHistory.objects.filter(
            dealer_id=int(dealer_id),
            created_at__gte=start_date
        ).order_by("created_at")

        serializer = DealerSegmentationHistorySerializer(history_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminSegmentationHistoryView(APIView):
    """API GET lấy lịch sử phân cụm toàn hệ thống, hỗ trợ phân trang từng trang."""
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["AI Segmentation"],
        summary="[Admin] Giám sát điểm số Silhouette toàn hệ thống (Phân trang)",
        description="Lấy danh sách phân trang (load từng trang) tất cả dữ liệu phân cụm AI của mọi đại lý để Admin đánh giá mô hình.",
        responses={200: paginated_response_schema(AdminSegmentationHistorySerializer, "PaginatedAdminSegmentationHistory")}
    )
    def get(self, request):
        # Lấy toàn bộ dữ liệu, ưu tiên các phiên mới nhất lên đầu
        queryset = CustomerSegmentationHistory.objects.all().order_by("-created_at")
        
        # HỌC HỎI TỪ DEALER VIEW: Khởi tạo và áp dụng bộ phân trang LoadMorePagination
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        
        # Serialize dữ liệu của trang hiện tại
        serializer = AdminSegmentationHistorySerializer(page, many=True)
        
        # Trả về kết quả bọc trong cấu trúc phân trang chuẩn của hệ thống (hỗ trợ trường `next`, `results`,...)
        return paginator.get_paginated_response(serializer.data)

# Tạo alias để map vào urls.py giống convention cũ của bạn
dealer_segmentation_history = DealerSegmentationHistoryView.as_view()
admin_segmentation_history = AdminSegmentationHistoryView.as_view()

@extend_schema(
    tags=["AI Recommendation"],
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

@extend_schema(
    tags=["AI Recommendation"],
    summary="Huấn luyện mô hình gợi ý sản phẩm mua kèm (Item2Vec)",
    description=(
        "API POST (LUỒNG 1): Chạy pipeline huấn luyện mô hình học sâu Item2Vec từ lịch sử đơn hàng. "
        "Bao gồm cơ chế Học kế thừa (Transfer Learning). Tác vụ nặng, tốn thời gian, chỉ dành cho Admin."
    ),
    request=None,
    responses={
        200: inline_serializer(
            name="TrainRelatedProductSuccessResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
        400: inline_serializer(
            name="TrainRelatedProductFailureResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
    },
)
class TrainRelatedProductView(APIView):
    """
    API (GET/POST): Huấn luyện lại mô hình AI và lấy lịch sử (Dashboard).
    GET: Trả về danh sách lịch sử huấn luyện (Dùng cho Dashboard Admin).
    POST: Thực hiện huấn luyện lại mô hình Item2Vec.
    Chỉ dành cho Admin gọi định kỳ hoặc khi thực sự cần update.
    """
    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["AI Recommendation"],
        summary="[Admin] Lịch sử huấn luyện mô hình AI (Phân trang)",
        description=(
            "Trả về danh sách các phiên huấn luyện Item2Vec, bao gồm loss, "
            "coverage tổng thể, và chi tiết coverage theo từng Dealer. "
            "Dùng để vẽ biểu đồ Loss/Coverage và phát hiện Dealer có vấn đề."
        ),
        responses={200: paginated_response_schema(AITrainingHistorySummarySerializer, "PaginatedAITrainingHistory")}
    )
    def get(self, request):

        queryset = AITrainingHistory.objects.all().order_by("-run_date")

        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = AITrainingHistorySummarySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=["AI Recommendation"],
        summary="Huấn luyện mô hình gợi ý sản phẩm (Item2Vec)",
        description="Huấn luyện mô hình AI và trả về kết quả training.",
        responses={200: inline_serializer(
            name="TrainRelatedProductSuccessResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        )}
    )

    def post(self, request):
        try:
            # GỌI HÀM HUẤN LUYỆN (train_pipeline)
            success, message = RelatedProductRecommendationService().train_pipeline()
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
                {"success": False, "message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "message": message},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["AI Recommendation"],
    summary="Đồng bộ nhanh danh sách gợi ý sản phẩm (Inference)",
    description=(
        "API POST (LUỒNG 2): Chỉ thực hiện tính toán độ tương đồng Cosine từ file ma trận trọng số `.keras` "
        "để lưu xuống CSDL mà không cần huấn luyện lại. Tốc độ siêu nhanh (< 1s)."
    ),
    request=None,
    responses={
        200: inline_serializer(
            name="SyncRelatedProductSuccessResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
        400: inline_serializer(
            name="SyncRelatedProductFailureResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
            },
        ),
    },
)
class SyncRelatedProductView(APIView):
    """
    API POST (LUỒNG 2): Đồng bộ Database từ file .keras tĩnh.
    Dành cho Admin gọi thủ công khi muốn cập nhật nhanh DB mà không cần Train.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        try:
            # GỌI HÀM ĐỒNG BỘ SUY LUẬN (inference_pipeline_only)
            success, message = RelatedProductRecommendationService().inference_pipeline_only()
        except Exception as exc:
            logger.exception("Related product recommendation sync failed")
            return Response(
                {
                    "success": False,
                    "message": f"Đồng bộ gợi ý sản phẩm thất bại: {exc}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not success:
            return Response(
                {"success": False, "message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "message": message},
            status=status.HTTP_200_OK,
        )
train_related_products = TrainRelatedProductView.as_view()
sync_related_products = SyncRelatedProductView.as_view()


# ---------------------------------------------------------
# DASHBOARD: LỊCH SỬ HUẤN LUYỆN AI (Admin)
# ---------------------------------------------------------


@extend_schema(
    tags=["AI Recommendation"],
    summary="[Admin] Chi tiết một phiên huấn luyện AI",
    description=(
        "Trả về toàn bộ thông tin chi tiết của một phiên huấn luyện, "
        "bao gồm mảng loss qua từng epoch (để vẽ biểu đồ đường) "
        "và danh sách Dealer bị cảnh báo thiếu gợi ý."
    ),
    responses={200: AITrainingHistorySerializer}
)
class AdminTrainingDashboardDetailView(APIView):
    """Chi tiết một phiên huấn luyện AI cụ thể."""
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        from django.shortcuts import get_object_or_404
        training = get_object_or_404(AITrainingHistory, pk=pk)
        serializer = AITrainingHistorySerializer(training)
        return Response(serializer.data, status=status.HTTP_200_OK)


admin_training_dashboard_detail = AdminTrainingDashboardDetailView.as_view()

# ---------------------------------------------------------
# API 1: HUẤN LUYỆN MÔ HÌNH (TRAIN)
# ---------------------------------------------------------
class DealerTrainModelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["AI Prediction"],
        summary="1. Huấn luyện mô hình AI cho Đại lý",
        description="Đọc dữ liệu lịch sử và huấn luyện mô hình LSTM & Quyết định. Kết quả model được lưu ra file `.keras`.",
        request=inline_serializer(
            name="DealerTrainRequest",
            fields={"dealer_id": serializers.IntegerField(help_text="ID của đại lý cần train")}
        ),
        responses={200: inline_serializer(name="DealerTrainSuccess", fields={"message": serializers.CharField()})}
    )
    def post(self, request, *args, **kwargs):
        dealer_id = request.data.get('dealer_id')
        if not dealer_id:
            return Response({"error": "Vui lòng cung cấp 'dealer_id'."}, status=status.HTTP_400_BAD_REQUEST)

        ai_service = TrendAndDecisionRecommendationService()
        success, message = ai_service.train_models(dealer_id=int(dealer_id))

        if not success:
            return Response({"error": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": message}, status=status.HTTP_200_OK)

# ---------------------------------------------------------
# API 2: GỌI PHÂN TÍCH TỪ MÔ HÌNH ĐÃ CÓ (INFERENCE)
# ---------------------------------------------------------
class DealerAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["AI Prediction"],
        summary="2. Phân tích và dự báo dựa trên Model",
        description="Load model đã train từ đĩa cứng, chạy dự báo cho dữ liệu kho mới nhất và cập nhật đè vào Database.",
        request=inline_serializer(
            name="DealerAnalyzeRequest",
            fields={"dealer_id": serializers.IntegerField(help_text="ID của đại lý cần phân tích")}
        ),
        responses={200: inline_serializer(name="DealerAnalyzeSuccess", fields={"message": serializers.CharField()})}
    )
    def post(self, request, *args, **kwargs):
        dealer_id = request.data.get('dealer_id')
        if not dealer_id:
            return Response({"error": "Vui lòng cung cấp 'dealer_id'."}, status=status.HTTP_400_BAD_REQUEST)

        ai_service = TrendAndDecisionRecommendationService()
        success, message = ai_service.analyze_data(dealer_id=int(dealer_id))

        if not success:
            return Response({"error": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": message}, status=status.HTTP_200_OK)

# ---------------------------------------------------------
# API 3: TRUY XUẤT KẾT QUẢ ĐÃ LƯU (READ DB)
# ---------------------------------------------------------
class DealerRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["AI Prediction"],
        summary="3. Lấy kết quả phân tích & gợi ý (từ Database)",
        description="Truy vấn dữ liệu đã được API Phân tích ghi xuống Database để hiển thị lên UI.",
        parameters=[
            OpenApiParameter("dealer_id", OpenApiTypes.INT, required=True),
            OpenApiParameter("decision_type", OpenApiTypes.STR, required=False),
            OpenApiParameter("category", OpenApiTypes.STR, required=False),
        ]
    )
    def get(self, request, *args, **kwargs):
        dealer_id = request.query_params.get('dealer_id')
        if not dealer_id:
            return Response({"error": "Vui lòng cung cấp 'dealer_id'."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = ProductPredictionResult.objects.filter(dealer_id=dealer_id)

        decision_filter = request.query_params.get('decision_type')
        category_filter = request.query_params.get('category')

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
        return Response({"summary_kpi": summary_stats, "recommendations": serializer.data}, status=status.HTTP_200_OK)

dealer_train_model = DealerTrainModelView.as_view()
dealer_analyze_data = DealerAnalyzeView.as_view()
dealer_recommendations = DealerRecommendationView.as_view()
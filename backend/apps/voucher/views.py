# promotions/views.py
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.promotions.models import Promotion, PromotionUsage
from .serializers import AvailablePromotionSerializer, PromotionSerializer
from rest_framework import viewsets
from common.permission import IsActive, IsAdminOrDealer, IsBuyer
from common.querysets import filter_admin_or_dealer_account
from decimal import Decimal
from django.db import transaction, IntegrityError
from rest_framework import status as http_status
from rest_framework.exceptions import ValidationError



class AvailablePromotionsView(APIView):
    """Trả về danh sách promotion mà customer hiện tại được phép chọn lúc checkout"""
    permission_classes = [IsActive, IsBuyer]

    def get(self, request):
        if not hasattr(request.user, "customer_profile"):
            return Response(
                {"detail": "Tài khoản không có quyền truy cập (thiếu thông tin khách hàng)."},
                status=http_status.HTTP_403_FORBIDDEN
            )
        customer = request.user.customer_profile
        now = timezone.now()

        segment_ids = customer.segments.values_list("id", flat=True)  # đổi nếu là FK 1-1

        # Promotion: approved + trong thời gian hiệu lực + match segment
        promotions = Promotion.objects.filter(
            status="active",
            start_date__lte=now,
            end_date__gte=now,
            targets__segment_id__in=segment_ids,
        ).distinct()

        # Loại promotion mà customer này đã dùng rồi
        used_promotion_ids = PromotionUsage.objects.filter(
            customer=customer
        ).values_list("promotion_id", flat=True)

        promotions = promotions.exclude(id__in=used_promotion_ids)

        serializer = AvailablePromotionSerializer(promotions, many=True)
        return Response(serializer.data)



class ApplyPromotionView(APIView):
    permission_classes = [IsActive, IsBuyer]

    def post(self, request):
        if not hasattr(request.user, "customer_profile"):
            return Response(
                {"detail": "Tài khoản không có quyền truy cập (thiếu thông tin khách hàng)."},
                status=http_status.HTTP_403_FORBIDDEN
            )
        promotion_id = request.data.get("promotion_id")
        order_id = request.data.get("order_id")
        order_total = Decimal(str(request.data.get("order_total", "0")))

        customer = request.user.customer_profile

        with transaction.atomic():
            try:
                promotion = Promotion.objects.select_for_update().get(id=promotion_id)
            except Promotion.DoesNotExist:
                raise ValidationError({"promotion_id": "Promotion không tồn tại."})

            if not promotion.is_active():
                raise ValidationError({"promotion_id": "Promotion không còn hiệu lực."})

            # Re-check segment match (phòng trường hợp segment customer đổi giữa lúc xem và lúc apply)
            customer_segment_ids = set(customer.segments.values_list("id", flat=True))
            target_segment_ids = set(promotion.targets.values_list("segment_id", flat=True))
            if not customer_segment_ids & target_segment_ids:
                raise ValidationError({"promotion_id": "Bạn không thuộc nhóm khách hàng áp dụng."})

            # Tính discount
            if promotion.discount_type == "percent":
                discount_amount = (order_total * promotion.discount_value) / Decimal("100")
            else:
                discount_amount = promotion.discount_value
            discount_amount = min(discount_amount, order_total)

            try:
                usage = PromotionUsage.objects.create(
                    promotion=promotion,
                    customer=customer,
                    order_id=order_id,
                    discount_amount=discount_amount,
                )
            except IntegrityError:
                # Customer đã dùng promotion này rồi (double-submit) -> DB constraint chặn
                raise ValidationError({"promotion_id": "Bạn đã sử dụng ưu đãi này rồi."})

        return Response({
            "promotion_id": promotion.id,
            "discount_amount": discount_amount,
            "total_before_discount": order_total,
            "total_after_discount": order_total - discount_amount,
            "usage_id": usage.id,
        }, status=http_status.HTTP_200_OK)


class PromotionViewSet(viewsets.ModelViewSet):
    """
    ViewSet để quản lý chương trình khuyến mãi (voucher).
    Admin có toàn quyền xem/tạo/sửa/xóa.
    Dealer chỉ có quyền thao tác trên các voucher thuộc tài khoản của mình.
    """
    permission_classes = [IsActive, IsAdminOrDealer]
    queryset = Promotion.objects.prefetch_related("targets").select_related(
        "dealer", "dealer__account"
    )
    serializer_class = PromotionSerializer

    def get_queryset(self):
        return filter_admin_or_dealer_account(
            self.queryset,
            self.request.user,
            account_lookup="dealer__account",
        )
# promotions/views.py
from django.utils import timezone
from rest_framework.response import Response
from apps.promotions.models import (
    CustomerSavedVoucher,
    Promotion,
    PromotionUsage,
    PromotionStatus,
)
from .serializers import (
    AvailablePromotionSerializer,
    PromotionSerializer,
    VerifyPromotionSerializer,
    CartApplyVoucherSerializer,
    CartApplyVoucherResponseSerializer,
    SavedPromotionSerializer,
)
from .services import CartVoucherService
from rest_framework import viewsets
from common.permission import IsActive, IsAdminOrDealer, IsBuyer, IsAdmin
from common.querysets import filter_admin_or_dealer_account
from rest_framework import status as http_status
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from rest_framework.decorators import action


@extend_schema_view(
    list=extend_schema(
        tags=["Vouchers"],
        summary="Danh sách voucher (Phân trang, Tìm kiếm, Lọc)",
        description="Admin xem tất cả. Dealer chỉ thấy voucher của mình." + PAGINATION_QUERY_HELP,
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo tiêu đề, mã voucher, hoặc mô tả", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái (draft, pending, active, inactive, expired, rejected)", required=False),
            OpenApiParameter("dealer_id", int, description="Lọc theo ID đại lý (chỉ Admin có tác dụng)", required=False),
            OpenApiParameter("discount_type", str, description="Lọc theo loại giảm giá (percent hoặc fixed)", required=False),
        ],
        responses={
            200: paginated_response_schema(
                PromotionSerializer,
                "PaginatedPromotionList",
            )
        },
    ),
    retrieve=extend_schema(tags=["Vouchers"], summary="Chi tiết voucher"),
    create=extend_schema(tags=["Vouchers"], summary="Tạo voucher mới"),
    update=extend_schema(tags=["Vouchers"], summary="Cập nhật toàn bộ voucher"),
    partial_update=extend_schema(tags=["Vouchers"], summary="Cập nhật một phần voucher"),
    destroy=extend_schema(tags=["Vouchers"], summary="Xóa voucher"),
)
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

    def get_permissions(self):
        if self.action == "verify":
            return [IsActive(), IsAdmin()]
        if self.action in ["apply", "available", "save", "unsave", "saved"]:
            return [IsActive(), IsBuyer()]
        return super().get_permissions()

    def _buyer_customer(self, request):
        if not hasattr(request.user, "customer_profile"):
            raise ValidationError("Tài khoản không có thông tin khách hàng.")
        return request.user.customer_profile

    def _available_promotions_for_customer(self, customer, dealer):
        now = timezone.now()
        segment_ids = list(customer.segment_memberships.values_list("segment_id", flat=True))

        promotions = Promotion.objects.filter(
            status=PromotionStatus.ACTIVE,
            start_date__lte=now,
            end_date__gte=now,
        ).prefetch_related("targets")

        if dealer:
            from django.db.models import Q
            promotions = promotions.filter(Q(dealer=dealer) | Q(dealer__isnull=True))
        else:
            promotions = promotions.filter(dealer__isnull=True)

        from django.db.models import Count, OuterRef, Subquery, IntegerField, Q, F

        global_usages_subquery = PromotionUsage.objects.filter(
            promotion=OuterRef("pk")
        ).values("promotion").annotate(count=Count("id")).values("count")

        customer_usages_subquery = PromotionUsage.objects.filter(
            promotion=OuterRef("pk"),
            order__customer=customer
        ).values("promotion").annotate(count=Count("id")).values("count")

        promotions = promotions.annotate(
            global_usage_count=Subquery(global_usages_subquery, output_field=IntegerField()),
            customer_usage_count=Subquery(customer_usages_subquery, output_field=IntegerField())
        )

        promotions = promotions.filter(
            Q(global_usage_count__isnull=True) |
            Q(usage_limit__isnull=True) |
            Q(global_usage_count__lt=F("usage_limit"))
        )

        promotions = promotions.filter(
            Q(customer_usage_count__isnull=True) |
            Q(usage_limit_per_customer__isnull=True) |
            Q(customer_usage_count__lt=F("usage_limit_per_customer"))
        )

        target_filter = Q(targets__isnull=True) | Q(targets__target_type="all")

        if segment_ids:
            target_filter |= Q(targets__target_type="segment", targets__segment_id__in=segment_ids)

        target_filter |= Q(targets__target_type="customer", targets__customer=customer)
        target_filter |= Q(targets__target_type="product") | Q(targets__target_type="category")

        return promotions.filter(target_filter).distinct()

    def _saved_promotion_ids(self, customer):
        return set(
            CustomerSavedVoucher.objects.filter(customer=customer).values_list(
                "promotion_id",
                flat=True,
            )
        )

    def _apply_filters(self, qs, request):
        from django.db.models import Q
        from common.status_counts import filter_by_status_param

        # 1. Search filter
        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(code__icontains=search) |
                Q(description__icontains=search)
            )

        # 2. Status filter
        status = request.query_params.get("status")
        if status:
            qs = filter_by_status_param(qs, status, field="status")

        # 3. Dealer filter (mainly for Admin)
        dealer_id = request.query_params.get("dealer_id")
        if dealer_id:
            qs = qs.filter(dealer_id=dealer_id)

        # 4. Discount type filter
        discount_type = request.query_params.get("discount_type")
        if discount_type:
            qs = qs.filter(discount_type=discount_type)

        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        qs = self._apply_filters(qs, request)

        from common.status_counts import build_count_status
        count_status = build_count_status(qs, field="status", choices=PromotionStatus)

        from common.pagination import LoadMorePagination
        paginator = LoadMorePagination()

        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data, count_status=count_status)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        instance.status = PromotionStatus.INACTIVE
        instance.save(update_fields=["status", "updated_at"])

    @extend_schema(
        tags=["Vouchers"],
        summary="Danh sách voucher khả dụng lúc checkout",
        description="Lấy danh sách các voucher đang hoạt động cho cửa hàng checkout.",
        parameters=[],
        responses={200: AvailablePromotionSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], permission_classes=[IsActive, IsBuyer])
    def available(self, request):
        customer = self._buyer_customer(request)
        dealer = request.user.store_dealer
        promotions = self._available_promotions_for_customer(customer, dealer)
        serializer = AvailablePromotionSerializer(
            promotions,
            many=True,
            context={"saved_promotion_ids": self._saved_promotion_ids(customer)},
        )
        return Response(serializer.data)

    @extend_schema(
        tags=["Vouchers"],
        summary="Danh sách voucher customer đã lưu",
        responses={200: SavedPromotionSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], permission_classes=[IsActive, IsBuyer])
    def saved(self, request):
        customer = self._buyer_customer(request)
        saved = CustomerSavedVoucher.objects.filter(customer=customer).select_related("promotion")
        serializer = SavedPromotionSerializer(saved, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Vouchers"],
        summary="Lưu voucher để dùng khi checkout",
        responses={200: AvailablePromotionSerializer},
    )
    @action(detail=True, methods=["post"], permission_classes=[IsActive, IsBuyer])
    def save(self, request, pk=None):
        customer = self._buyer_customer(request)
        dealer = request.user.store_dealer
        promotion = self._available_promotions_for_customer(customer, dealer).filter(pk=pk).first()
        if promotion is None:
            raise ValidationError("Voucher không khả dụng để lưu.")

        CustomerSavedVoucher.objects.get_or_create(
            customer=customer,
            promotion=promotion,
        )
        serializer = AvailablePromotionSerializer(
            promotion,
            context={"saved_promotion_ids": {promotion.id}},
        )
        return Response(serializer.data)

    @extend_schema(
        tags=["Vouchers"],
        summary="Bỏ lưu voucher",
    )
    @action(detail=True, methods=["delete"], permission_classes=[IsActive, IsBuyer])
    def unsave(self, request, pk=None):
        customer = self._buyer_customer(request)
        CustomerSavedVoucher.objects.filter(
            customer=customer,
            promotion_id=pk,
        ).delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)

    @extend_schema(
        tags=["Vouchers"],
        summary="Áp dụng voucher cho đơn hàng",
        description="Xác thực các điều kiện áp dụng voucher và trả về thông tin giảm giá.",
        request=CartApplyVoucherSerializer,
        examples=[
            OpenApiExample(
                name="Ví dụ áp dụng voucher",
                value={
                    "voucher_code": "SALE50K",
                    "items": [
                        {"dealer_product_id": 45, "quantity": 3},
                        {"dealer_product_id": 88, "quantity": 1},
                    ]
                },
                request_only=True,
            )
        ],
        responses={200: CartApplyVoucherResponseSerializer},
    )
    @action(detail=False, methods=["post"], permission_classes=[IsActive, IsBuyer])
    def apply(self, request):
        if not hasattr(request.user, "customer_profile"):
            return Response(
                {"detail": "Tài khoản không có quyền truy cập (thiếu thông tin khách hàng)."},
                status=http_status.HTTP_403_FORBIDDEN
            )

        customer = request.user.customer_profile
        serializer = CartApplyVoucherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        voucher_code = serializer.validated_data["voucher_code"]
        items = serializer.validated_data["items"]

        # Gọi Service để xử lý logic tính toán và kiểm tra
        result = CartVoucherService.apply_voucher(
            customer=customer,
            voucher_code=voucher_code,
            items_data=items
        )

        return Response(result, status=http_status.HTTP_200_OK)

    @extend_schema(
        tags=["Vouchers"],
        summary="Admin duyệt / từ chối duyệt voucher",
        description="`rejected` bắt buộc `reject_reason`.",
        request=VerifyPromotionSerializer,
        responses={200: PromotionSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsActive, IsAdmin],
        url_path="verify",
    )
    def verify(self, request, pk=None):
        promotion = self.get_object()
        serializer = VerifyPromotionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        status = serializer.validated_data["status"]
        reject_reason = serializer.validated_data.get("reject_reason")

        promotion.status = status
        if status == "rejected":
            promotion.reject_reason = reject_reason
        else:
            promotion.reject_reason = None

        promotion.save(update_fields=["status", "reject_reason", "updated_at"])

        return Response(PromotionSerializer(promotion, context={"request": request}).data)
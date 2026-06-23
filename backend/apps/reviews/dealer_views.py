"""API đánh giá — đại lý xem review sản phẩm cửa hàng."""

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountRole
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import paginate_queryset
from common.permission import IsAdminOrDealer

from . import services
from .models import ProductReview
from .serializers import ProductReviewDetailSerializer, ProductReviewListSerializer


def _parse_int_param(raw, field_name):
    if raw is None or raw == "":
        return None
    try:
        return int(raw)
    except (TypeError, ValueError) as exc:
        raise ValidationError({field_name: f"{field_name} phải là số nguyên."}) from exc


def _reviews_queryset_for_user(request):
    user = request.user
    params = request.query_params

    if user.role == AccountRole.DEALER:
        if not hasattr(user, "dealer_profile"):
            raise PermissionDenied("Bạn cần có hồ sơ đại lý.")
        dealer = user.dealer_profile
    elif user.role == AccountRole.ADMIN:
        dealer = None
        dealer_id = _parse_int_param(params.get("dealer_id"), "dealer_id")
        if dealer_id is not None:
            from apps.dealers.models import DealerProfile

            try:
                dealer = DealerProfile.objects.get(pk=dealer_id)
            except DealerProfile.DoesNotExist as exc:
                raise ValidationError({"dealer_id": "Đại lý không tồn tại."}) from exc
    else:
        raise PermissionDenied("Không có quyền.")

    qs = services.get_product_reviews_queryset(
        dealer=dealer,
        dealer_product_id=_parse_int_param(params.get("dealer_product_id"), "dealer_product_id"),
    )
    rating = _parse_int_param(params.get("rating"), "rating")
    if rating is not None:
        if rating < 1 or rating > 5:
            raise ValidationError({"rating": "rating phải từ 1 đến 5."})
        qs = qs.filter(rating=rating)
    order_id = _parse_int_param(params.get("order_id"), "order_id")
    if order_id is not None:
        qs = qs.filter(order_id=order_id)
    return qs


class DealerProductReviewListView(APIView):
    """Đại lý / admin xem review trên sản phẩm cửa hàng."""

    permission_classes = [IsAdminOrDealer]

    @extend_schema(
        tags=["Dealer Product Reviews"],
        operation_id="dealer_product_reviews_list",
        summary="[Dealer] Danh sách đánh giá sản phẩm",
        description=(
            "Dealer: review trên cửa hàng mình. Admin: tất cả (lọc `dealer_id`).\n"
            "Query: `dealer_product_id`, `rating`, `order_id`."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter(
                name="dealer_id",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Admin: lọc theo đại lý",
            ),
            OpenApiParameter(
                name="dealer_product_id",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
            OpenApiParameter(
                name="rating",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Lọc theo số sao 1–5",
            ),
            OpenApiParameter(
                name="order_id",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
        ],
        responses={
            200: paginated_response_schema(
                ProductReviewListSerializer,
                "PaginatedDealerProductReview",
            )
        },
    )
    def get(self, request):
        qs = _reviews_queryset_for_user(request)

        def serialize(page):
            return ProductReviewListSerializer(
                page, many=True, context={"request": request}
            ).data

        return paginate_queryset(self, request, qs, serialize)


class DealerProductReviewDetailView(APIView):
    """Chi tiết review — dealer/admin."""

    permission_classes = [IsAdminOrDealer]

    @extend_schema(
        tags=["Dealer Product Reviews"],
        operation_id="dealer_product_reviews_retrieve",
        summary="[Dealer] Chi tiết đánh giá",
        responses={200: ProductReviewDetailSerializer},
    )
    def get(self, request, pk):
        user = request.user
        try:
            review = (
                ProductReview.objects.select_related(
                    "customer_profile__user",
                    "dealer_product",
                    "order",
                    "dealer",
                )
                .prefetch_related("images")
                .get(pk=pk)
            )
        except ProductReview.DoesNotExist as exc:
            raise NotFound("Đánh giá không tồn tại.") from exc

        if user.role == AccountRole.DEALER:
            if not hasattr(user, "dealer_profile") or review.dealer_id != user.dealer_profile.id:
                raise PermissionDenied("Không có quyền.")

        return Response(
            ProductReviewDetailSerializer(review, context={"request": request}).data
        )

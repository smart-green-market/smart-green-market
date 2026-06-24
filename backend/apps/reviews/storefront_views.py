"""API đánh giá sản phẩm — buyer trên storefront."""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStorefrontCustomer
from apps.customers.services import get_active_dealer_by_slug
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.openapi_files import MULTIPART_FILE_UPLOAD_NOTE, multipart_request
from common.pagination import paginate_queryset

from . import services
from .openapi import (
    REVIEW_CREATE_EXAMPLE,
    ReviewCreateForm,
    ReviewImagesUploadForm,
)
from .models import ProductReview
from .serializers import (
    PendingReviewItemSerializer,
    ProductReviewCreateSerializer,
    ProductReviewDetailSerializer,
    ProductReviewListSerializer,
    ProductReviewSummarySerializer,
    ProductReviewUpdateSerializer,
    ReviewImageSerializer,
    ReviewImageUploadSerializer,
)


def _get_dealer_or_404(dealer_slug):
    try:
        return get_active_dealer_by_slug(dealer_slug)
    except Exception as exc:
        raise NotFound("Gian hàng không tồn tại hoặc chưa hoạt động.") from exc


def _get_storefront_product(dealer, product_id):
    try:
        return DealerProduct.objects.get(
            pk=product_id,
            dealer_profile=dealer,
            status=DealerProductStatus.ACTIVE,
        )
    except DealerProduct.DoesNotExist as exc:
        raise NotFound("Sản phẩm không tồn tại hoặc không còn bán.") from exc


def _get_review_for_user(review_id, dealer, user):
    try:
        review = (
            services.get_product_reviews_queryset(dealer=dealer)
            .get(pk=review_id)
        )
    except ProductReview.DoesNotExist as exc:
        raise NotFound("Đánh giá không tồn tại.") from exc
    if not hasattr(user, "customer_profile"):
        raise PermissionDenied("Chỉ buyer được thao tác review của mình.")
    if review.customer_profile_id != user.customer_profile.id:
        raise PermissionDenied("Không có quyền sửa/xóa đánh giá này.")
    return review


class StorefrontProductReviewListView(APIView):
    """Danh sách review công khai theo sản phẩm."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_product_reviews_list",
        summary="[Public] Danh sách đánh giá sản phẩm",
        description="Review công khai trên trang chi tiết SP." + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(ProductReviewListSerializer, "PaginatedProductReview"),
        },
        auth=[],
    )
    def get(self, request, dealer_slug, product_id):
        dealer = _get_dealer_or_404(dealer_slug)
        _get_storefront_product(dealer, product_id)
        qs = services.get_product_reviews_queryset(
            dealer=dealer,
            dealer_product_id=product_id,
        )

        def serialize(page):
            return ProductReviewListSerializer(
                page, many=True, context={"request": request}
            ).data

        return paginate_queryset(self, request, qs, serialize)


class StorefrontProductReviewSummaryView(APIView):
    """Tổng hợp rating — hiển thị sao trung bình."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_product_reviews_summary",
        summary="[Public] Tổng hợp rating sản phẩm",
        responses={200: ProductReviewSummarySerializer},
        auth=[],
    )
    def get(self, request, dealer_slug, product_id):
        dealer = _get_dealer_or_404(dealer_slug)
        _get_storefront_product(dealer, product_id)
        data = services.get_review_summary(dealer=dealer, dealer_product_id=product_id)
        return Response(ProductReviewSummarySerializer(data).data)


class StorefrontReviewListCreateView(APIView):
    """Buyer tạo review / xem review của mình."""

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        return [IsStorefrontCustomer()]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_my_reviews_list",
        summary="[Buyer] Đánh giá của tôi",
        description="Danh sách review buyer đã gửi tại cửa hàng này." + PAGINATION_QUERY_HELP,
        responses={
            200: paginated_response_schema(ProductReviewListSerializer, "PaginatedMyReview"),
        },
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        qs = services.get_product_reviews_queryset(dealer=dealer).filter(
            customer_profile=request.user.customer_profile,
        )

        def serialize(page):
            return ProductReviewListSerializer(
                page, many=True, context={"request": request}
            ).data

        return paginate_queryset(self, request, qs, serialize)

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_reviews_create",
        summary="[Buyer] Tạo đánh giá",
        description=(
            "Sau đơn **completed**. Multipart — `order_id`, `dealer_product_id`, "
            f"`rating` (1–5), `comment`, `images[]` (tối đa {services.MAX_IMAGES_PER_REVIEW}).\n\n"
            + MULTIPART_FILE_UPLOAD_NOTE
        ),
        request=multipart_request(ReviewCreateForm),
        responses={201: ProductReviewDetailSerializer},
        examples=[REVIEW_CREATE_EXAMPLE],
    )
    def post(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        serializer = ProductReviewCreateSerializer(
            data=request.data,
            context={"request": request, "dealer": dealer},
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        review = services.get_product_reviews_queryset(dealer=dealer).get(pk=review.pk)
        return Response(
            ProductReviewDetailSerializer(review, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class StorefrontPendingReviewsView(APIView):
    """SP trong đơn completed chưa review."""

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_pending_reviews_list",
        summary="[Buyer] Sản phẩm chờ đánh giá",
        responses={200: PendingReviewItemSerializer(many=True)},
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        items = services.get_pending_review_items(
            customer=request.user.customer_profile,
            dealer=dealer,
        )
        return Response(PendingReviewItemSerializer(items, many=True).data)


class StorefrontReviewDetailView(APIView):
    """Chi tiết / sửa / xóa review của buyer."""

    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsStorefrontCustomer()]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_reviews_retrieve",
        summary="Chi tiết đánh giá",
        responses={200: ProductReviewDetailSerializer},
    )
    def get(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        try:
            review = services.get_product_reviews_queryset(dealer=dealer).get(pk=pk)
        except ProductReview.DoesNotExist as exc:
            raise NotFound("Đánh giá không tồn tại.") from exc
        return Response(
            ProductReviewDetailSerializer(review, context={"request": request}).data
        )

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_reviews_partial_update",
        summary="[Buyer] Sửa đánh giá của tôi",
        request=ProductReviewUpdateSerializer,
        responses={200: ProductReviewDetailSerializer},
    )
    def patch(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        review = _get_review_for_user(pk, dealer, request.user)
        serializer = ProductReviewUpdateSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        review = services.get_product_reviews_queryset(dealer=dealer).get(pk=review.pk)
        return Response(
            ProductReviewDetailSerializer(review, context={"request": request}).data
        )

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_reviews_delete",
        summary="[Buyer] Xóa đánh giá của tôi",
        responses={204: None},
    )
    def delete(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        review = _get_review_for_user(pk, dealer, request.user)
        services.delete_product_review(review)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StorefrontReviewImagesView(APIView):
    """Thêm / xóa ảnh review."""

    parser_classes = [MultiPartParser, FormParser]

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_review_images_create",
        summary="[Buyer] Thêm ảnh vào review",
        request=multipart_request(ReviewImagesUploadForm),
        responses={201: ReviewImageSerializer(many=True)},
    )
    def post(self, request, dealer_slug, pk):
        dealer = _get_dealer_or_404(dealer_slug)
        review = _get_review_for_user(pk, dealer, request.user)
        serializer = ReviewImageUploadSerializer(
            data={},
            context={"review": review, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        images = serializer.save()
        return Response(
            ReviewImageSerializer(images, many=True, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class StorefrontReviewImageDetailView(APIView):
    """Xóa một ảnh review."""

    permission_classes = [IsStorefrontCustomer]

    @extend_schema(
        tags=["Storefront Reviews"],
        operation_id="storefront_review_images_delete",
        summary="[Buyer] Xóa ảnh review",
        responses={204: None},
    )
    def delete(self, request, dealer_slug, pk, image_id):
        dealer = _get_dealer_or_404(dealer_slug)
        review = _get_review_for_user(pk, dealer, request.user)
        services.delete_review_image(review=review, image_id=image_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

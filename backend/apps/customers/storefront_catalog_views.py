"""API catalog sản phẩm buyer — danh mục, tìm kiếm, chi tiết."""

from django.db.models import Prefetch

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountDocument, AccountDocumentStatus, AccountStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus

from .catalog_services import (
    apply_storefront_product_filters,
    build_storefront_dealer_about_context,
    get_storefront_bestseller_products,
    get_storefront_categories_qs,
    get_storefront_product_detail,
    get_storefront_products_qs,
    get_storefront_related_products,
    parse_bestseller_limit,
)
from apps.dealer_products.related_recommendation_services import parse_related_limit
from .services import get_active_dealer_by_slug
from .storefront_catalog_serializers import (
    StorefrontBestsellerProductSerializer,
    StorefrontCategorySerializer,
    StorefrontDealerProfileSerializer,
    StorefrontProductDetailSerializer,
    StorefrontProductListSerializer,
)
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import paginate_queryset

STOREFRONT_CATALOG_SEARCH_PARAMS = [
    OpenApiParameter(
        name="category",
        type=int,
        location=OpenApiParameter.QUERY,
        required=False,
        description="Lọc theo ID danh mục cửa hàng",
    ),
    OpenApiParameter(
        name="search",
        type=str,
        location=OpenApiParameter.QUERY,
        required=False,
        description="Tìm theo tên SP, mô tả, tên NCC gốc, tên danh mục (alias: `q`)",
    ),
    OpenApiParameter(
        name="in_stock",
        type=bool,
        location=OpenApiParameter.QUERY,
        required=False,
        description="true — chỉ sản phẩm còn tồn khả dụng",
    ),
    OpenApiParameter(
        name="ordering",
        type=str,
        location=OpenApiParameter.QUERY,
        required=False,
        description=(
            "Sắp xếp: price, -price, name, -name, updated_at, -updated_at, "
            "stock, -stock (mặc định: -updated_at)"
        ),
    ),
]


def _get_dealer_or_404(dealer_slug):
    try:
        return get_active_dealer_by_slug(dealer_slug)
    except DealerProfile.DoesNotExist as exc:
        raise NotFound("Gian hàng không tồn tại hoặc chưa hoạt động.") from exc


def _get_dealer_profile_for_about(dealer_slug):
    """Dealer active kèm giấy tờ đã duyệt — phục vụ trang About."""
    try:
        return (
            DealerProfile.objects.select_related("account")
            .prefetch_related(
                Prefetch(
                    "account__documents",
                    queryset=AccountDocument.objects.filter(
                        status=AccountDocumentStatus.APPROVED,
                    ).only("document_type"),
                ),
            )
            .get(
                slug=dealer_slug,
                status=DealerProfileStatus.ACTIVE,
                account__status=AccountStatus.ACTIVE,
            )
        )
    except DealerProfile.DoesNotExist as exc:
        raise NotFound("Gian hàng không tồn tại hoặc chưa hoạt động.") from exc


class StorefrontDealerProfileView(APIView):
    """Thông tin gian hàng công khai — trang Giới thiệu / Liên hệ."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Catalog"],
        operation_id="storefront_catalog_dealer_retrieve",
        summary="Thông tin gian hàng đại lý",
        description=(
            "Buyer xem trang Giới thiệu / Liên hệ: hồ sơ cửa hàng, liên hệ, "
            "chỉ số gian hàng, tổng hợp đánh giá, chính sách giao hàng. "
            "Danh mục / SP bán chạy gọi API riêng. Chỉ gian hàng đang hoạt động."
        ),
        responses={200: StorefrontDealerProfileSerializer},
        auth=[],
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_profile_for_about(dealer_slug)
        about = build_storefront_dealer_about_context(dealer)
        return Response(
            StorefrontDealerProfileSerializer(
                dealer,
                context={"request": request, **about},
            ).data
        )


class StorefrontCategoryListView(APIView):
    """Danh mục sản phẩm của gian hàng đại lý — public."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Catalog"],
        operation_id="storefront_catalog_categories_list",
        summary="Danh mục sản phẩm gian hàng",
        description=(
            "Buyer xem toàn bộ danh mục `active` của cửa hàng: "
            "danh mục hệ thống + danh mục riêng do đại lý tạo. "
            "Mỗi danh mục kèm `product_count` (số SP `active`) để frontend lọc hoặc ẩn danh mục rỗng."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                StorefrontCategorySerializer,
                "PaginatedStorefrontCategory",
            )
        },
        auth=[],
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        categories_qs = get_storefront_categories_qs(dealer)

        def serialize(page):
            return StorefrontCategorySerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, categories_qs, serialize)


class StorefrontProductListView(APIView):
    """Danh sách / tìm kiếm sản phẩm gian hàng — public."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Catalog"],
        operation_id="storefront_catalog_products_list",
        summary="Danh sách & tìm kiếm sản phẩm",
        description=(
            "Buyer duyệt hoặc tìm sản phẩm đang bán của đại lý. "
            "Không cần đăng nhập."
            + PAGINATION_QUERY_HELP
        ),
        parameters=STOREFRONT_CATALOG_SEARCH_PARAMS,
        responses={
            200: paginated_response_schema(
                StorefrontProductListSerializer,
                "PaginatedStorefrontProduct",
            )
        },
        auth=[],
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        products_qs = apply_storefront_product_filters(
            get_storefront_products_qs(dealer),
            request.query_params,
        )

        def serialize(page):
            return StorefrontProductListSerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, products_qs, serialize)


class StorefrontBestsellerProductListView(APIView):
    """Top sản phẩm bán chạy trên gian hàng — public."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Catalog"],
        operation_id="storefront_catalog_products_bestsellers",
        summary="Sản phẩm bán chạy",
        description=(
            "Buyer xem top sản phẩm bán chạy nhất của cửa hàng. "
            "Xếp hạng theo tổng `quantity` trên các đơn buyer đã xác nhận "
            "(confirmed → completed), chỉ sản phẩm `active`. "
            "Không cần đăng nhập."
        ),
        parameters=[
            OpenApiParameter(
                name="limit",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Số sản phẩm trả về (mặc định 10, tối đa 20)",
            ),
            OpenApiParameter(
                name="in_stock",
                type=bool,
                location=OpenApiParameter.QUERY,
                required=False,
                description="true — chỉ sản phẩm còn tồn khả dụng",
            ),
        ],
        responses={200: StorefrontBestsellerProductSerializer(many=True)},
        auth=[],
    )
    def get(self, request, dealer_slug):
        dealer = _get_dealer_or_404(dealer_slug)
        limit = parse_bestseller_limit(request.query_params.get("limit"))
        in_stock = request.query_params.get("in_stock")
        in_stock_only = in_stock is not None and str(in_stock).lower() in (
            "true",
            "1",
            "yes",
        )
        products = get_storefront_bestseller_products(
            dealer,
            limit=limit,
            in_stock_only=in_stock_only,
        )
        return Response(
            StorefrontBestsellerProductSerializer(
                products,
                many=True,
                context={"request": request},
            ).data
        )


class StorefrontProductDetailView(APIView):
    """Chi tiết một sản phẩm trên gian hàng — public."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Catalog"],
        operation_id="storefront_catalog_product_retrieve",
        summary="Chi tiết sản phẩm",
        description=(
            "Buyer xem thông tin đầy đủ sản phẩm: ảnh, giá, tồn khả dụng, "
            "hướng dẫn bảo quản, quy trình canh tác từ NCC gốc. "
            "Chỉ sản phẩm `active` của đúng gian hàng."
        ),
        responses={200: StorefrontProductDetailSerializer},
        auth=[],
    )
    def get(self, request, dealer_slug, product_id):
        dealer = _get_dealer_or_404(dealer_slug)
        if not str(product_id).isdigit():
            raise ValidationError({"product_id": "ID sản phẩm không hợp lệ."})

        product = get_storefront_product_detail(dealer, product_id)
        if product is None:
            raise NotFound("Sản phẩm không tồn tại hoặc không còn bán tại cửa hàng này.")

        return Response(
            StorefrontProductDetailSerializer(product, context={"request": request}).data
        )


class StorefrontRelatedProductListView(APIView):
    """Sản phẩm liên quan trên trang chi tiết — public."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Catalog"],
        operation_id="storefront_catalog_product_related_list",
        summary="Sản phẩm liên quan",
        description=(
            "Buyer xem danh sách sản phẩm gợi ý liên quan của một SP trên gian hàng. "
            "Ưu tiên `related_product_ids` đã cấu hình; nếu chưa có thì fallback "
            "các SP cùng danh mục. Chỉ trả sản phẩm `active`. Không cần đăng nhập."
        ),
        parameters=[
            OpenApiParameter(
                name="limit",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Số sản phẩm trả về (mặc định 10, tối đa 20)",
            ),
        ],
        responses={200: StorefrontProductListSerializer(many=True)},
        auth=[],
    )
    def get(self, request, dealer_slug, product_id):
        dealer = _get_dealer_or_404(dealer_slug)
        if not str(product_id).isdigit():
            raise ValidationError({"product_id": "ID sản phẩm không hợp lệ."})

        limit = parse_related_limit(request.query_params.get("limit"))
        source_product, products = get_storefront_related_products(
            dealer,
            product_id,
            limit=limit,
        )
        if source_product is None:
            raise NotFound("Sản phẩm không tồn tại hoặc không còn bán tại cửa hàng này.")

        return Response(
            StorefrontProductListSerializer(
                products,
                many=True,
                context={"request": request},
            ).data
        )

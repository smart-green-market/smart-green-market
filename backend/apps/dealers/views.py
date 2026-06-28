"""API quản lý hồ sơ đại lý và luồng duyệt."""

from django.conf import settings
from django.db.models import Prefetch
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.accounts.document_serializers import AccountDocumentListSerializer
from apps.accounts.models import AccountDocument, AccountDocumentStatus, AccountDocumentType, AccountStatus
from apps.categories.serializers import DealerStoreCategorySerializer
from apps.customers.catalog_services import get_storefront_categories_qs
from apps.dealer_products.models import DealerProduct, DealerProductStatus
from apps.dealer_products.serializers import DealerProductReadSerializer
from common.notification_messages import dealer_verification_updated
from common.notifications import notify_account, notify_admins
from common.openapi import (
    PAGINATION_QUERY_HELP,
    SupplierAccountStatusSerializer,
    VerifyDealerSerializer,
    paginated_response_schema,
)
from common.openapi_files import multipart_request
from common.verify_openapi import (
    DEALER_VERIFY_APPROVE,
    DEALER_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.pagination import paginate_queryset
from common.permission import IsActive, IsAdmin, IsAdminOrDealer, IsDealer
from common.querysets import ORDER_DOCUMENT, ORDER_NEWEST, _apply_order, filter_admin_or_dealer_account

from .models import DealerProfile, DealerProfileStatus
from .openapi import (
    DEALER_PROFILE_WRITE_HELP,
    DealerProfileCreateForm,
    DealerProfileUpdateForm,
)
from .serializers import (
    DealerProfileDetailSerializer,
    DealerProfileListSerializer,
    DealerProfileSerializer,
    DealerStorefrontLinkSerializer,
)

REQUIRED_DOCUMENT_TYPES = [choice[0] for choice in AccountDocumentType.choices]

DEALER_CREATE_EXAMPLE = OpenApiExample(
    "Tạo hồ sơ đại lý (Bước 2 onboarding)",
    value={
        "store_name": "Cua hang Rau Sach ABC",
        "store_address": "456 Duong Y, Quan Z, TP.HCM",
        "description": "Dai ly phan phoi rau cu huu co",
    },
    request_only=True,
)


def _active_dealer_catalog_qs():
    """Đại lý đã duyệt — buyer/dealer khác xem catalog cửa hàng."""
    return DealerProfile.objects.filter(
        status=DealerProfileStatus.ACTIVE,
        account__status=AccountStatus.ACTIVE,
    )


def _validate_dealer_ready_for_approval(dealer):
    docs = {doc.document_type: doc for doc in dealer.account.documents.all()}
    missing = [t for t in REQUIRED_DOCUMENT_TYPES if t not in docs]
    if missing:
        raise ValidationError({
            "detail": f"Đại lý chưa upload đủ giấy tờ: {', '.join(missing)}",
        })
    not_approved = [
        t for t in REQUIRED_DOCUMENT_TYPES
        if docs[t].status != AccountDocumentStatus.APPROVED
    ]
    if not_approved:
        raise ValidationError({
            "detail": f"Còn giấy tờ chưa được duyệt: {', '.join(not_approved)}",
        })


@extend_schema_view(
    list=extend_schema(
        tags=["Dealers"],
        summary="Danh sách đại lý",
        description="Admin xem tất cả. Dealer chỉ thấy hồ sơ của mình." + PAGINATION_QUERY_HELP,
        responses={200: paginated_response_schema(DealerProfileListSerializer, "PaginatedDealer")},
    ),
    retrieve=extend_schema(
        tags=["Dealers"],
        summary="Chi tiết đại lý (Admin review)",
        description=(
            "**Luồng duyệt Admin:**\n"
            "1. `GET /api/dealers/{id}/`\n"
            "2. Duyệt giấy tờ: `POST /api/account-documents/{document_id}/verify/`\n"
            "3. `POST /api/dealers/{id}/verify/`\n\n"
            "Trả về: `account`, `documents`, `products`."
        ),
        responses={200: DealerProfileDetailSerializer},
    ),
    create=extend_schema(
        tags=["Dealers"],
        summary="Tạo hồ sơ đại lý",
        description=(
            "**Bước 2 onboarding** — sau `POST /api/register/` với `role=dealer`.\n\n"
            f"{DEALER_PROFILE_WRITE_HELP}\n\n"
            "Mỗi account chỉ tạo **1** hồ sơ. `status` mặc định `pending`."
        ),
        request=multipart_request(DealerProfileCreateForm),
        responses={201: DealerProfileSerializer},
        examples=[DEALER_CREATE_EXAMPLE],
    ),
    update=extend_schema(
        tags=["Dealers"],
        summary="Cập nhật toàn bộ hồ sơ",
        description=DEALER_PROFILE_WRITE_HELP,
        request=multipart_request(DealerProfileUpdateForm),
        responses={200: DealerProfileSerializer},
    ),
    partial_update=extend_schema(
        tags=["Dealers"],
        summary="Cập nhật một phần hồ sơ",
        description=DEALER_PROFILE_WRITE_HELP,
        request=multipart_request(DealerProfileUpdateForm),
        responses={200: DealerProfileSerializer},
    ),
    destroy=extend_schema(tags=["Dealers"], summary="Xóa hồ sơ đại lý"),
)
class DealerProfileViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD hồ sơ đại lý."""

    queryset = DealerProfile.objects.select_related("account")
    serializer_class = DealerProfileSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DealerProfileDetailSerializer
        if self.action == "list":
            return DealerProfileListSerializer
        return DealerProfileSerializer

    def get_permissions(self):
        if self.action in ("verify", "account_status"):
            return [IsAdmin()]
        if self.action in ("storefront_link", "me"):
            return [IsDealer()]
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsDealer()]
        if self.action in ("categories", "products"):
            return [IsActive()]
        return [IsAdminOrDealer()]

    def get_queryset(self):
        qs = self.queryset
        if self.action in ("categories", "products"):
            return _active_dealer_catalog_qs()
        if self.action in ("retrieve", "verify", "me"):
            qs = qs.select_related("account", "verified_by").prefetch_related(
                Prefetch(
                    "account__documents",
                    queryset=AccountDocument.objects.select_related("verified_by"),
                ),
                Prefetch(
                    "products",
                    queryset=DealerProduct.objects.select_related(
                        "supplier_product",
                        "category",
                    )
                    .prefetch_related("images")
                    .order_by("-updated_at", "-created_at", "-id"),
                ),
            )
        return filter_admin_or_dealer_account(
            qs,
            self.request.user,
            account_lookup="account",
            ordering=ORDER_NEWEST,
            pending_field="status",
            pending_values=DealerProfileStatus.PENDING,
        )

    def perform_create(self, serializer):
        dealer = serializer.save()
        notify_admins(
            title="[Đại lý] Có hồ sơ mới chờ duyệt",
            content=f"Đại lý {dealer.store_name} cần được duyệt.",
            reference_type="dealer",
            reference_id=dealer.id,
            created_by=self.request.user,
        )

    @extend_schema(
        tags=["Dealers"],
        summary="Hồ sơ đại lý hiện tại",
        description="Dealer lấy hồ sơ của mình kèm `documents[]` và `products[]`.",
        responses={200: DealerProfileDetailSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        try:
            dealer = self.get_queryset().get(account=request.user)
        except DealerProfile.DoesNotExist as exc:
            raise ValidationError({"detail": "Tài khoản đại lý chưa có hồ sơ."}) from exc

        return Response(
            DealerProfileDetailSerializer(dealer, context={"request": request}).data
        )

    @extend_schema(
        tags=["Dealers"],
        summary="Link gian hàng của đại lý hiện tại",
        description=(
            "Dealer dùng endpoint này để lấy URL public gửi/PR cho buyer. "
            "URL = `STOREFRONT_BASE_URL` + `/cua-hang/{slug}` — "
            "`slug` là mã ngẫu nhiên (vd. `k7m-x9p-q2n`), không suy ra từ tên cửa hàng."
        ),
        responses={200: DealerStorefrontLinkSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me/storefront-link")
    def storefront_link(self, request):
        try:
            dealer = request.user.dealer_profile
        except DealerProfile.DoesNotExist as exc:
            raise ValidationError({"detail": "Tài khoản đại lý chưa có hồ sơ."}) from exc

        storefront_path = f"/cua-hang/{dealer.slug}"
        storefront_url = f"{settings.STOREFRONT_BASE_URL}{storefront_path}"
        can_share = (
            dealer.status == DealerProfileStatus.ACTIVE
            and dealer.account.status == AccountStatus.ACTIVE
        )

        return Response(
            {
                "dealer_id": dealer.id,
                "store_name": dealer.store_name,
                "slug": dealer.slug,
                "status": dealer.status,
                "storefront_path": storefront_path,
                "storefront_url": storefront_url,
                "can_share": can_share,
            }
        )

    @extend_schema(
        tags=["Dealers"],
        summary="Admin duyệt đại lý",
        description=(
            "Sau khi duyệt đủ 3 giấy tờ `approved`.\n"
            "- `active`: kích hoạt hồ sơ + tài khoản\n"
            "- `rejected`: từ chối (bắt buộc `rejection_reason`)"
            + VERIFY_REJECT_HELP
        ),
        request=VerifyDealerSerializer,
        responses={200: DealerProfileDetailSerializer},
        examples=[DEALER_VERIFY_APPROVE, DEALER_VERIFY_REJECT],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        dealer = self.get_object()
        serializer = VerifyDealerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        rejection_reason = serializer.validated_data.get("rejection_reason", "")

        if new_status == DealerProfileStatus.ACTIVE:
            _validate_dealer_ready_for_approval(dealer)

        dealer.status = new_status
        dealer.rejection_reason = rejection_reason
        dealer.verified_by = request.user
        dealer.verified_at = timezone.now()
        dealer.save(
            update_fields=[
                "status",
                "rejection_reason",
                "verified_by",
                "verified_at",
                "updated_at",
            ]
        )

        if new_status == DealerProfileStatus.ACTIVE:
            account = dealer.account
            if account.status == AccountStatus.PENDING:
                account.status = AccountStatus.ACTIVE
                account.save(update_fields=["status", "updated_at"])
        elif new_status == DealerProfileStatus.REJECTED:
            dealer.account.status = AccountStatus.PENDING
            dealer.account.save(update_fields=["status", "updated_at"])

        title, content, notif_type = dealer_verification_updated(dealer)
        if rejection_reason:
            content = f"{content} Ghi chú: {rejection_reason}"
        notify_account(
            account=dealer.account,
            title=title,
            content=content,
            reference_type="dealer",
            reference_id=dealer.id,
            created_by=request.user,
            notif_type=notif_type,
        )
        return Response(
            DealerProfileDetailSerializer(dealer, context={"request": request}).data
        )

    @extend_schema(
        tags=["Dealers"],
        summary="Admin quản lý trạng thái tài khoản đại lý",
        request=SupplierAccountStatusSerializer,
        responses={200: DealerProfileDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="account-status")
    def account_status(self, request, pk=None):
        dealer = self.get_object()
        serializer = SupplierAccountStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        reason = serializer.validated_data.get("reason", "")

        dealer.account.status = new_status
        dealer.account.save(update_fields=["status", "updated_at"])

        status_labels = {
            "active": "Kích hoạt",
            "inactive": "Tạm khóa",
            "banned": "Vô hiệu hóa",
        }
        notify_account(
            account=dealer.account,
            title=f"[Tài khoản] {status_labels.get(new_status, new_status)}",
            content=(
                f"Tài khoản {dealer.store_name} "
                f"đã được {status_labels.get(new_status, new_status).lower()}."
                + (f" Lý do: {reason}" if reason else "")
            ),
            reference_type="dealer",
            reference_id=dealer.id,
            created_by=request.user,
            notif_type="warning" if new_status != "active" else "success",
        )
        return Response(
            DealerProfileDetailSerializer(dealer, context={"request": request}).data
        )

    @extend_schema(
        tags=["Dealers"],
        summary="Danh sách giấy tờ theo đại lý",
        responses={
            200: paginated_response_schema(
                AccountDocumentListSerializer,
                "PaginatedDealerAccountDocument",
            )
        },
    )
    @action(detail=True, methods=["get"], url_path="documents")
    def documents(self, request, pk=None):
        dealer = self.get_object()
        documents = _apply_order(
            dealer.account.documents.select_related("account", "verified_by"),
            ORDER_DOCUMENT,
            pending_field="status",
        )

        def serialize(page):
            return AccountDocumentListSerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, documents, serialize)

    @extend_schema(
        tags=["Dealers"],
        summary="Danh mục cửa hàng đại lý (buyer catalog)",
        description=(
            "Buyer/dealer xem toàn bộ danh mục `active` của cửa hàng (system + custom), "
            "kèm `product_count` — cùng logic với `GET /api/storefronts/{slug}/categories/`."
        ),
        responses={
            200: paginated_response_schema(
                DealerStoreCategorySerializer,
                "PaginatedDealerStoreCategory",
            )
        },
    )
    @action(detail=True, methods=["get"], url_path="categories")
    def categories(self, request, pk=None):
        dealer = self.get_object()
        categories_qs = get_storefront_categories_qs(dealer)

        def serialize(page):
            return DealerStoreCategorySerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, categories_qs, serialize)

    @extend_schema(
        tags=["Dealers"],
        summary="Sản phẩm bán lẻ của cửa hàng đại lý",
        description=(
            "Buyer xem sản phẩm đang bán của đại lý. "
            "Lọc theo `category` (query param, ID danh mục cửa hàng)."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                DealerProductReadSerializer,
                "PaginatedDealerStoreProduct",
            )
        },
    )
    @action(detail=True, methods=["get"], url_path="products")
    def products(self, request, pk=None):
        dealer = self.get_object()
        products_qs = (
            DealerProduct.objects.filter(
                dealer_profile=dealer,
                status=DealerProductStatus.ACTIVE,
            )
            .select_related("supplier_product", "category")
            .prefetch_related("images")
            .order_by("-updated_at", "-created_at", "-id")
        )
        category_id = request.query_params.get("category")
        if category_id:
            products_qs = products_qs.filter(category_id=category_id)

        def serialize(page):
            return DealerProductReadSerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, products_qs, serialize)

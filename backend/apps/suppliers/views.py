"""API quản lý nhà cung cấp và luồng duyệt hồ sơ."""

from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.accounts.document_serializers import AccountDocumentListSerializer
from apps.accounts.models import (
    AccountDocument,
    AccountDocumentStatus,
    AccountDocumentType,
    AccountRole,
    AccountStatus,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.supplier_products.serializer import SupplierProductListSerializer
from common.notification_messages import supplier_verification_updated
from common.notifications import notify_account
from common.openapi import (
    PAGINATION_QUERY_HELP,
    SupplierAccountStatusSerializer,
    VerifySupplierSerializer,
    paginated_response_schema,
)
from common.verify_openapi import (
    SUPPLIER_VERIFY_APPROVE,
    SUPPLIER_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.pagination import paginate_queryset
from common.permission import (
    IsAdmin,
    IsAdminOrDealer,
    IsAdminOrSupplier,
    IsAdminOrSupplierProfile,
    IsSupplier,
)
from common.querysets import (
    ORDER_DOCUMENT,
    ORDER_NEWEST,
    ORDER_UPDATED,
    _apply_order,
    filter_admin_or_supplier_account,
    filter_supplier_products_for_dealer,
    filter_suppliers_for_dealer,
)

from .models import Supplier, SupplierVerificationStatus
from .openapi import (
    SUPPLIER_CATALOG_LIST_EXAMPLE,
    SUPPLIER_PRODUCTS_BY_SUPPLIER_EXAMPLE,
    SUPPLIER_PRODUCTS_CATALOG_HELP,
)
from .serializers import (
    SupplierCatalogSerializer,
    SupplierDetailSerializer,
    SupplierListSerializer,
    SupplierSerializer,
)

REQUIRED_DOCUMENT_TYPES = [choice[0] for choice in AccountDocumentType.choices]

SUPPLIER_CREATE_EXAMPLE = OpenApiExample(
    "Tạo hồ sơ supplier (Bước 2 onboarding)",
    value={
        "company_name": "Cong ty Nong San ABC",
        "tax_code": "0123456789",
        "phone": "0901234567",
        "address": "123 Duong X, Quan Y, Ha Noi",
        "description": "Chuyen cung cap rau cu huu co",
        "bank_name": "Vietcombank",
        "bank_bin": "970436",
        "account_number": "26022005111",
        "account_name": "Nguyễn Công Mẫn",
    },
    request_only=True,
)


def _validate_supplier_ready_for_approval(supplier):
    """Kiểm tra supplier đã upload đủ và được duyệt hết giấy tờ bắt buộc."""
    docs = {doc.document_type: doc for doc in supplier.account.documents.all()}
    missing = [t for t in REQUIRED_DOCUMENT_TYPES if t not in docs]
    if missing:
        raise ValidationError({
            "detail": f"Supplier chưa upload đủ giấy tờ: {', '.join(missing)}",
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
        tags=["Suppliers"],
        summary="Danh sách nhà cung cấp",
        description=(
            "Admin: tất cả NCC. Supplier: hồ sơ của mình.\n"
            "Dealer: catalog NCC đã duyệt — sau đó `GET /api/suppliers/{id}/products/` để chọn SP."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(SupplierListSerializer, "PaginatedSupplier"),
        },
        examples=[SUPPLIER_CATALOG_LIST_EXAMPLE],
    ),
    retrieve=extend_schema(
        tags=["Suppliers"],
        summary="Chi tiết nhà cung cấp (Admin review)",
        description=(
            "**Luồng duyệt Admin:**\n"
            "1. Mở chi tiết supplier (`GET /api/suppliers/{supplier_id}/`)\n"
            "2. Xem `documents[]` — lấy `documents[].id` từng giấy tờ\n"
            "3. Duyệt từng giấy tờ: `POST /api/account-documents/{document_id}/verify/`\n"
            "4. Khi đủ 3 giấy tờ approved → duyệt supplier: `POST /api/suppliers/{supplier_id}/verify/`\n\n"
            "Trả về: `account`, `documents`, `certifications`, `products`."
        ),
        responses={200: SupplierDetailSerializer},
    ),
    create=extend_schema(
        tags=["Suppliers"],
        summary="Tạo hồ sơ nhà cung cấp",
        description=(
            "**Bước 2 onboarding** — gọi ngay sau `POST /api/register/` với Bearer token.\n\n"
            "- Mỗi account chỉ tạo được **1** supplier profile.\n"
            "- `account` tự gắn theo JWT, không cần gửi.\n"
            "- `verification_status` mặc định `pending`.\n"
            "- TK nhận tiền (VietQR): chọn ngân hàng từ `GET /api/banks/`, "
            "gửi `bank_bin` + `bank_name` khớp; `account_number`, `account_name` "
            "(khuyến nghị không dấu, viết hoa cho VietQR)."
        ),
        request=SupplierSerializer,
        responses={201: SupplierSerializer},
        examples=[SUPPLIER_CREATE_EXAMPLE],
    ),
    update=extend_schema(
        tags=["Suppliers"],
        summary="Cập nhật toàn bộ hồ sơ",
        responses={200: SupplierSerializer},
    ),
    partial_update=extend_schema(
        tags=["Suppliers"],
        summary="Cập nhật một phần hồ sơ",
        responses={200: SupplierSerializer},
    ),
    destroy=extend_schema(
        tags=["Suppliers"],
        summary="Xóa hồ sơ nhà cung cấp",
        description="Xóa vĩnh viễn supplier và dữ liệu liên quan (cascade).",
    ),
)
class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD hồ sơ nhà cung cấp và các thao tác duyệt liên quan."""

    queryset = Supplier.objects.select_related("account")
    serializer_class = SupplierSerializer

    def get_serializer_class(self):
        if (
            self.request.user.is_authenticated
            and self.request.user.role == AccountRole.DEALER
            and self.action in ("list", "retrieve")
        ):
            return SupplierCatalogSerializer
        if self.action == "retrieve":
            return SupplierDetailSerializer
        if self.action == "list":
            return SupplierListSerializer
        return SupplierSerializer

    def get_permissions(self):
        if self.action in ("verify", "account_status"):
            return [IsAdmin()]
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSupplier()]
        if self.action == "documents":
            return [IsAdminOrSupplierProfile()]
        if self.action == "products":
            return [IsAdminOrDealer()]
        if self.action in ("list", "retrieve"):
            return [IsAdminOrSupplier()]
        return [IsAdminOrSupplier()]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if user.role == AccountRole.DEALER:
            if self.action in ("list", "retrieve", "products"):
                qs = filter_suppliers_for_dealer(qs)
                if self.action in ("list", "retrieve"):
                    qs = qs.annotate(
                        active_product_count=Count(
                            "products",
                            filter=Q(products__status=SupplierProductStatus.ACTIVE),
                        )
                    )
                return qs
            return qs.none()
        if self.action == "products" and user.role == AccountRole.ADMIN:
            return qs
        if self.action in ["retrieve", "verify"]:
            qs = qs.select_related("account").prefetch_related(
                Prefetch(
                    "account__documents",
                    queryset=AccountDocument.objects.select_related("verified_by"),
                ),
                "certifications",
                Prefetch(
                    "products",
                    queryset=SupplierProduct.objects.select_related(
                        "category", "verified_by"
                    )
                    .prefetch_related("images")
                    .order_by("-updated_at", "-created_at", "-id"),
                ),
            )
        return filter_admin_or_supplier_account(
            qs,
            user,
            account_lookup="account",
            ordering=ORDER_NEWEST,
            pending_field="verification_status",
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @extend_schema(
        tags=["Suppliers"],
        summary="Admin duyệt nhà cung cấp (bước cuối)",
        description=(
            "**Bước 4 trong luồng duyệt** — sau khi duyệt hết giấy tờ.\n\n"
            "- URL `{id}` = **supplier_id** (cùng id khi xem chi tiết supplier)\n"
            "- `approved`: yêu cầu đủ 3 loại giấy tờ và tất cả đã `approved`; "
            "kích hoạt tài khoản supplier (`account.status=active`)\n"
            "- `rejected`: từ chối hồ sơ supplier (bắt buộc `rejection_reason`)"
            + VERIFY_REJECT_HELP
        ),
        request=VerifySupplierSerializer,
        responses={200: SupplierDetailSerializer},
        examples=[SUPPLIER_VERIFY_APPROVE, SUPPLIER_VERIFY_REJECT],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        supplier = self.get_object()
        serializer = VerifySupplierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["verification_status"]
        rejection_reason = serializer.validated_data.get("rejection_reason", "")

        if new_status == SupplierVerificationStatus.APPROVED:
            _validate_supplier_ready_for_approval(supplier)

        supplier.verification_status = new_status
        supplier.rejection_reason = rejection_reason
        supplier.verified_by = request.user
        supplier.verified_at = timezone.now()
        supplier.save(
            update_fields=[
                "verification_status",
                "rejection_reason",
                "verified_by",
                "verified_at",
                "updated_at",
            ]
        )

        if new_status == SupplierVerificationStatus.APPROVED:
            account = supplier.account
            if account.status == AccountStatus.PENDING:
                account.status = AccountStatus.ACTIVE
                account.save(update_fields=["status", "updated_at"])
        elif new_status == SupplierVerificationStatus.REJECTED:
            supplier.account.status = AccountStatus.PENDING
            supplier.account.save(update_fields=["status", "updated_at"])

        title, content, notif_type = supplier_verification_updated(supplier)
        if rejection_reason:
            content = f"{content} Ghi chú: {rejection_reason}"
        notify_account(
            account=supplier.account,
            title=title,
            content=content,
            reference_type="supplier",
            reference_id=supplier.id,
            created_by=request.user,
            notif_type=notif_type,
        )
        return Response(SupplierDetailSerializer(supplier, context={"request": request}).data)

    @extend_schema(
        tags=["Suppliers"],
        summary="Admin quản lý trạng thái tài khoản NCC",
        description=(
            "Kích hoạt (`active`), tạm khóa (`inactive`) hoặc vô hiệu hóa (`banned`) "
            "tài khoản gắn với nhà cung cấp."
        ),
        request=SupplierAccountStatusSerializer,
        responses={200: SupplierDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="account-status")
    def account_status(self, request, pk=None):
        supplier = self.get_object()
        serializer = SupplierAccountStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        reason = serializer.validated_data.get("reason", "")

        supplier.account.status = new_status
        supplier.account.save(update_fields=["status", "updated_at"])

        status_labels = {
            "active": "Kích hoạt",
            "inactive": "Tạm khóa",
            "banned": "Vô hiệu hóa",
        }
        notify_account(
            account=supplier.account,
            title=f"[Tài khoản] {status_labels.get(new_status, new_status)}",
            content=(
                f"Tài khoản {supplier.company_name} "
                f"đã được {status_labels.get(new_status, new_status).lower()}."
                + (f" Lý do: {reason}" if reason else "")
            ),
            reference_type="supplier",
            reference_id=supplier.id,
            created_by=request.user,
            notif_type="warning" if new_status != "active" else "success",
        )
        return Response(SupplierDetailSerializer(supplier, context={"request": request}).data)

    @extend_schema(
        tags=["Suppliers"],
        summary="Danh sách sản phẩm theo nhà cung cấp",
        description=(
            "**Dealer — catalog đặt hàng (phiếu nhập):**\n"
            "1. `GET /api/suppliers/` → lấy `id` NCC (`verification_status=approved`)\n"
            "2. **`GET /api/suppliers/{supplier_id}/products/`** (endpoint này)\n"
            "3. `POST /api/purchase-orders/` — `supplier_id` + `items[].supplier_product_id`\n\n"
            "Path `{id}` = **supplier_id** (cùng id từ bước 1).\n"
            "Admin: xem mọi SP của NCC (mọi trạng thái)."
            + SUPPLIER_PRODUCTS_CATALOG_HELP
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                SupplierProductListSerializer,
                "PaginatedSupplierProductsBySupplier",
            ),
            401: OpenApiResponse(description="Chưa đăng nhập hoặc token hết hạn"),
            403: OpenApiResponse(description="Tài khoản không phải dealer/admin"),
            404: OpenApiResponse(
                description="NCC không tồn tại hoặc dealer không được xem (chưa approved)"
            ),
        },
        examples=[SUPPLIER_PRODUCTS_BY_SUPPLIER_EXAMPLE],
    )
    @action(detail=True, methods=["get"])
    def products(self, request, pk=None):
        supplier = self.get_object()
        products_qs = SupplierProduct.objects.select_related(
            "supplier",
            "supplier__account",
            "category",
            "verified_by",
        ).prefetch_related("images")

        if request.user.role == AccountRole.DEALER:
            products_qs = filter_supplier_products_for_dealer(
                products_qs,
                supplier_id=supplier.id,
                ordering=ORDER_UPDATED,
            )
        else:
            products_qs = products_qs.filter(supplier_id=supplier.id).order_by(
                *ORDER_UPDATED
            )

        def serialize(page):
            return SupplierProductListSerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, products_qs, serialize)

    @extend_schema(
        tags=["Suppliers"],
        summary="Danh sách giấy tờ theo nhà cung cấp",
        description=(
            "Lấy toàn bộ giấy tờ của tài khoản gắn với supplier theo `supplier_id`.\n\n"
            "Admin xem mọi supplier. Supplier chỉ xem được hồ sơ của mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                AccountDocumentListSerializer,
                "PaginatedSupplierAccountDocument",
            )
        },
    )
    @action(detail=True, methods=["get"], url_path="documents")
    def documents(self, request, pk=None):
        supplier = self.get_object()
        documents = _apply_order(
            supplier.account.documents.select_related("account", "verified_by"),
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

from django.db.models import Prefetch
from django.utils import timezone
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiExample,
)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import AccountStatus
from apps.supplier_products.models import SupplierProduct
from common.openapi import (
    PAGINATION_QUERY_HELP,
    SupplierAccountStatusSerializer,
    VerifySupplierSerializer,
    paginated_response_schema,
)
from common.pagination import paginate_queryset
from common.permission import IsAdmin, IsAdminOrSupplier, IsSupplier
from common.querysets import (
    ORDER_DOCUMENT,
    ORDER_NEWEST,
    _apply_order,
    filter_admin_or_supplier_account,
)
from common.notification_messages import (
    admin_new_supplier_document,
    supplier_document_reviewed,
    supplier_verification_updated,
)
from common.notifications import notify_account, notify_admins
from .openapi import SupplierDocumentBulkUploadForm, SupplierDocumentReplaceForm
from .models import (
    Supplier,
    SupplierDocument,
    SupplierDocumentStatus,
    SupplierDocumentType,
    SupplierVerificationStatus,
)
from .serializers import (
    SupplierListSerializer,
    SupplierSerializer,
    SupplierDetailSerializer,
    SupplierDocumentListSerializer,
    SupplierDocumentReadSerializer,
    SupplierDocumentSerializer,
    SupplierDocumentBulkUploadSerializer,
    VerifySupplierDocumentSerializer,
)

REQUIRED_DOCUMENT_TYPES = [choice[0] for choice in SupplierDocumentType.choices]

SUPPLIER_CREATE_EXAMPLE = OpenApiExample(
    "Tạo hồ sơ supplier (Bước 2 onboarding)",
    value={
        "company_name": "Cong ty Nong San ABC",
        "tax_code": "0123456789",
        "phone": "0901234567",
        "address": "123 Duong X, Quan Y, Ha Noi",
        "description": "Chuyen cung cap rau cu huu co",
    },
    request_only=True,
)


def _notify_document_review(document, reviewer):
    title, content, notif_type = supplier_document_reviewed(document)
    notify_account(
        account=document.supplier.account,
        title=title,
        content=content,
        reference_type="supplier_document",
        reference_id=document.id,
        created_by=reviewer,
        notif_type=notif_type,
    )


def _notify_admins_new_document(document, created_by):
    title, content = admin_new_supplier_document(document)
    notify_admins(
        title=title,
        content=content,
        reference_type="supplier_document",
        reference_id=document.id,
        created_by=created_by,
    )


def _apply_document_verification(document, reviewer, new_status):
    document.status = new_status
    document.verified_by = reviewer
    document.verified_at = timezone.now()
    document.save()
    _notify_document_review(document, reviewer)
    return document


def _validate_supplier_ready_for_approval(supplier):
    docs = {doc.document_type: doc for doc in supplier.documents.all()}
    missing = [t for t in REQUIRED_DOCUMENT_TYPES if t not in docs]
    if missing:
        raise ValidationError({
            "detail": f"Supplier chưa upload đủ giấy tờ: {', '.join(missing)}",
        })
    not_approved = [
        t for t in REQUIRED_DOCUMENT_TYPES
        if docs[t].status != SupplierDocumentStatus.APPROVED
    ]
    if not_approved:
        raise ValidationError({
            "detail": f"Còn giấy tờ chưa được duyệt: {', '.join(not_approved)}",
        })


@extend_schema_view(
    list=extend_schema(
        tags=["Suppliers"],
        summary="Danh sách nhà cung cấp",
        description="Admin xem tất cả. Supplier/Dealer chỉ thấy hồ sơ của mình." + PAGINATION_QUERY_HELP,
        responses={200: paginated_response_schema(SupplierListSerializer, "PaginatedSupplier")},
    ),
    retrieve=extend_schema(
        tags=["Suppliers"],
        summary="Chi tiết nhà cung cấp (Admin review)",
        description=(
            "**Luồng duyệt Admin:**\n"
            "1. Mở chi tiết supplier (`GET /api/suppliers/{supplier_id}/`)\n"
            "2. Xem `documents[]` — lấy `documents[].id` từng giấy tờ\n"
            "3. Duyệt từng giấy tờ: `POST /api/supplier-documents/{document_id}/verify/`\n"
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
            "- `verification_status` mặc định `pending`."
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
    queryset = Supplier.objects.select_related("account")
    serializer_class = SupplierSerializer

    def get_serializer_class(self):
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
        return [IsAdminOrSupplier()]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if self.action in ["retrieve", "verify"]:
            qs = qs.prefetch_related(
                "documents__verified_by",
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
            "- `rejected`: từ chối hồ sơ supplier"
        ),
        request=VerifySupplierSerializer,
        responses={200: SupplierDetailSerializer},
        examples=[
            OpenApiExample(
                "Duyệt supplier",
                value={"verification_status": "approved"},
                request_only=True,
            )
        ],
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
        tags=["Supplier Documents"],
        summary="Danh sách giấy tờ theo nhà cung cấp",
        description=(
            "Lấy toàn bộ giấy tờ của một supplier theo `supplier_id`.\n\n"
            "Admin xem mọi supplier. Supplier chỉ xem được hồ sơ của mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                SupplierDocumentListSerializer,
                "PaginatedSupplierDocumentRead",
            )
        },
    )
    @action(detail=True, methods=["get"], url_path="documents")
    def documents(self, request, pk=None):
        supplier = self.get_object()
        documents = _apply_order(
            supplier.documents.select_related(
                "supplier__account",
                "verified_by",
            ),
            ORDER_DOCUMENT,
            pending_field="status",
        )

        def serialize(page):
            return SupplierDocumentListSerializer(
                page,
                many=True,
                context={"request": request},
            ).data

        return paginate_queryset(self, request, documents, serialize)


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Documents"],
        summary="Danh sách giấy tờ",
        description=(
            "Admin xem tất cả giấy tờ. Supplier/Dealer chỉ thấy của mình.\n\n"
            "Lọc theo supplier (Admin): `?supplier_id={id}`\n"
            "Hoặc dùng: `GET /api/suppliers/{supplier_id}/documents/`\n\n"
            "Duyệt giấy tờ: `POST /api/supplier-documents/{document_id}/verify/`"
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                SupplierDocumentListSerializer,
                "PaginatedSupplierDocument",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Supplier Documents"],
        summary="Chi tiết giấy tờ",
        responses={200: SupplierDocumentListSerializer},
    ),
    create=extend_schema(
        tags=["Supplier Documents"],
        summary="Upload 3 loại giấy tờ (một lần)",
        description=(
            "Chọn **3 file** trực tiếp trên Swagger (multipart/form-data).\n\n"
            "Gửi đủ 3 field sau khi đã tạo supplier profile:\n"
            "- `business_license` — Giấy phép kinh doanh\n"
            "- `id_card` — CMND/CCCD\n"
            "- `tax_certificate` — Giấy chứng nhận thuế\n\n"
            "Upload lại sẽ thay file cũ và reset trạng thái về `pending`."
        ),
        request={
            "multipart/form-data": SupplierDocumentBulkUploadForm,
        },
        responses={201: SupplierDocumentReadSerializer(many=True)},
    ),
    update=extend_schema(
        tags=["Supplier Documents"],
        summary="Thay thế giấy tờ",
        description="Chọn file mới qua field `file_url` (multipart/form-data).",
        request={
            "multipart/form-data": SupplierDocumentReplaceForm,
        },
        responses={200: SupplierDocumentReadSerializer},
    ),
    partial_update=extend_schema(
        tags=["Supplier Documents"],
        summary="Cập nhật một phần giấy tờ",
        description="Chọn file mới qua field `file_url` (multipart/form-data).",
        request={
            "multipart/form-data": SupplierDocumentReplaceForm,
        },
        responses={200: SupplierDocumentReadSerializer},
    ),
    destroy=extend_schema(tags=["Supplier Documents"], summary="Xóa giấy tờ"),
)
class SupplierDocumentViewSet(viewsets.ModelViewSet):
    queryset = SupplierDocument.objects.select_related(
        "supplier",
        "supplier__account",
        "verified_by",
    )
    serializer_class = SupplierDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == "create":
            return SupplierDocumentBulkUploadSerializer
        if self.action in ("list", "retrieve"):
            return SupplierDocumentListSerializer
        return SupplierDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        documents = serializer.save()
        for document in documents:
            _notify_admins_new_document(document, request.user)
        return Response(
            SupplierDocumentReadSerializer(
                documents,
                many=True,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSupplier()]
        if self.action == "verify":
            return [IsAdmin()]
        return [IsAdminOrSupplier()]

    def get_queryset(self):
        qs = self.queryset
        if self.request.user.role == "admin":
            supplier_id = self.request.query_params.get("supplier_id")
            if supplier_id:
                qs = qs.filter(supplier_id=supplier_id)
            return _apply_order(
                qs,
                ORDER_DOCUMENT,
                pending_field="status",
            )
        return filter_admin_or_supplier_account(
            qs,
            self.request.user,
            ordering=ORDER_DOCUMENT,
            pending_field="status",
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @extend_schema(
        tags=["Supplier Documents"],
        summary="Admin duyệt giấy tờ",
        description=(
            "Chỉ cần **document_id** — supplier suy ra từ khóa ngoại `supplier`.\n\n"
            "- URL `{id}` = **document id** (`documents[].id` hoặc `GET /api/supplier-documents/`)\n"
            "- Body: `{ \"status\": \"approved\" }` hoặc `\"rejected\"`\n\n"
            "Ví dụ: `POST /api/supplier-documents/5/verify/`"
        ),
        request=VerifySupplierDocumentSerializer,
        responses={200: SupplierDocumentListSerializer},
        examples=[
            OpenApiExample(
                "Duyệt giấy tờ",
                value={"status": "approved"},
                request_only=True,
            )
        ],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        document = self.get_object()
        serializer = VerifySupplierDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = _apply_document_verification(
            document,
            request.user,
            serializer.validated_data["status"],
        )
        return Response(
            SupplierDocumentListSerializer(
                document,
                context={"request": request},
            ).data
        )

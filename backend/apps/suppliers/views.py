from django.contrib.auth import get_user_model
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
from common.openapi import VerifySupplierSerializer
from common.permission import IsAdmin, IsAdminOrSupplier, IsSupplier
from apps.notifications.models import Notification, NotificationReceipt
from .openapi import SupplierDocumentBulkUploadForm, SupplierDocumentReplaceForm
from .models import (
    Supplier,
    SupplierDocument,
    SupplierDocumentStatus,
    SupplierDocumentType,
    SupplierVerificationStatus,
)
from .serializers import (
    SupplierSerializer,
    SupplierDetailSerializer,
    SupplierDocumentReadSerializer,
    SupplierDocumentSerializer,
    SupplierDocumentBulkUploadSerializer,
    VerifySupplierDocumentSerializer,
)
User = get_user_model()

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
    supplier_user = document.supplier.account
    notification = Notification.objects.create(
        title="Supplier document updated",
        content=f"Your document was {document.status}",
        type="success" if document.status == SupplierDocumentStatus.APPROVED else "error",
        reference_type="supplier_document",
        reference_id=document.id,
        created_by=reviewer,
    )
    NotificationReceipt.objects.create(
        notification=notification,
        account=supplier_user,
    )


def _notify_admins_new_document(document, created_by):
    admins = User.objects.filter(role="admin")
    notification = Notification.objects.create(
        title="New supplier document pending",
        content=(
            f"Supplier {document.supplier.id} uploaded {document.document_type} "
            "waiting for review"
        ),
        type="info",
        reference_type="supplier_document",
        reference_id=document.id,
        created_by=created_by,
    )
    NotificationReceipt.objects.bulk_create([
        NotificationReceipt(notification=notification, account=admin)
        for admin in admins
    ])


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
        description="Admin xem tất cả. Supplier chỉ thấy hồ sơ của mình.",
        responses={200: SupplierSerializer(many=True)},
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
        return SupplierSerializer

    def get_permissions(self):
        if self.action == "verify":
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
                    ).prefetch_related("images"),
                ),
            )
        if user.role == "admin":
            return qs
        return qs.filter(account=user)

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

        if new_status == SupplierVerificationStatus.APPROVED:
            _validate_supplier_ready_for_approval(supplier)

        supplier.verification_status = new_status
        supplier.save(update_fields=["verification_status", "updated_at"])

        if new_status == SupplierVerificationStatus.APPROVED:
            account = supplier.account
            if account.status == AccountStatus.PENDING:
                account.status = AccountStatus.ACTIVE
                account.save(update_fields=["status", "updated_at"])

        notification = Notification.objects.create(
            title="Supplier verification updated",
            content=f"Your supplier account was {supplier.verification_status}",
            type="info",
            reference_type="supplier",
            reference_id=supplier.id,
            created_by=request.user,
        )
        NotificationReceipt.objects.create(
            notification=notification,
            account=supplier.account,
        )
        return Response(SupplierDetailSerializer(supplier, context={"request": request}).data)


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Documents"],
        summary="Danh sách giấy tờ",
        description=(
            "Admin xem tất cả giấy tờ. Supplier chỉ thấy của mình.\n\n"
            "Duyệt giấy tờ: `POST /api/supplier-documents/{document_id}/verify/`"
        ),
        responses={200: SupplierDocumentSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Supplier Documents"],
        summary="Chi tiết giấy tờ",
        responses={200: SupplierDocumentSerializer},
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
    queryset = SupplierDocument.objects.select_related("supplier", "verified_by")
    serializer_class = SupplierDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == "create":
            return SupplierDocumentBulkUploadSerializer
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
        user = self.request.user
        if user.role == "admin":
            return self.queryset
        return self.queryset.filter(supplier__account=user)

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
        responses={200: SupplierDocumentReadSerializer},
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
            SupplierDocumentReadSerializer(document, context={"request": request}).data
        )

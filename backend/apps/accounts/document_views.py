"""API quản lý giấy tờ xác minh tài khoản (supplier/dealer)."""

from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.notification_messages import account_document_reviewed, admin_new_account_document
from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.openapi_files import MULTIPART_FILE_UPLOAD_NOTE, multipart_request
from common.verify_openapi import (
    DOCUMENT_VERIFY_APPROVE,
    DOCUMENT_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.pagination import paginate_queryset
from common.permission import IsAdmin, IsAdminOrSupplier, IsSupplierOrDealer
from common.querysets import (
    ORDER_DOCUMENT,
    ORDER_DOCUMENT_BY_ACCOUNT,
    _apply_order,
    filter_admin_or_dealer_account,
    filter_admin_or_supplier_account,
)

from .document_openapi import AccountDocumentBulkUploadForm, AccountDocumentReplaceForm
from .document_serializers import (
    AccountDocumentBulkUploadSerializer,
    AccountDocumentListSerializer,
    AccountDocumentReadSerializer,
    AccountDocumentSerializer,
    VerifyAccountDocumentSerializer,
)
from .models import AccountDocument, AccountDocumentStatus, AccountDocumentType, AccountRole

REQUIRED_DOCUMENT_TYPES = [choice[0] for choice in AccountDocumentType.choices]


def _notify_document_review(document, reviewer, rejection_reason=""):
    title, content, notif_type = account_document_reviewed(
        document,
        rejection_reason=rejection_reason,
    )
    notify_account(
        account=document.account,
        title=title,
        content=content,
        reference_type="account_document",
        reference_id=document.id,
        created_by=reviewer,
        notif_type=notif_type,
    )


def _notify_admins_new_document(document, created_by):
    title, content = admin_new_account_document(document)
    notify_admins(
        title=title,
        content=content,
        reference_type="account_document",
        reference_id=document.id,
        created_by=created_by,
    )


def _apply_document_verification(document, reviewer, new_status, rejection_reason=""):
    document.status = new_status
    document.verified_by = reviewer
    document.verified_at = timezone.now()
    document.save()
    _notify_document_review(document, reviewer, rejection_reason=rejection_reason)
    return document


@extend_schema_view(
    list=extend_schema(
        tags=["Account Documents"],
        summary="Danh sách giấy tờ",
        description=(
            "Admin xem tất cả giấy tờ. Supplier/Dealer chỉ thấy của mình.\n\n"
            "Lọc theo tài khoản (Admin): `?account_id={id}`\n\n"
            "Duyệt giấy tờ: `POST /api/account-documents/{document_id}/verify/`"
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                AccountDocumentListSerializer,
                "PaginatedAccountDocument",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Account Documents"],
        summary="Chi tiết giấy tờ",
        responses={200: AccountDocumentListSerializer},
    ),
    create=extend_schema(
        tags=["Account Documents"],
        summary="Upload 3 loại giấy tờ (một lần)",
        description=(
            f"{MULTIPART_FILE_UPLOAD_NOTE}\n\n"
            "Gửi đủ 3 file sau khi đăng ký với role supplier hoặc dealer:\n"
            "- `business_license` — Giấy phép kinh doanh\n"
            "- `id_card` — CMND/CCCD\n"
            "- `tax_certificate` — Giấy chứng nhận thuế\n\n"
            "Upload lại sẽ thay file cũ và reset trạng thái về `pending`."
        ),
        request=multipart_request(AccountDocumentBulkUploadForm),
        responses={201: AccountDocumentReadSerializer(many=True)},
    ),
    update=extend_schema(
        tags=["Account Documents"],
        summary="Thay thế giấy tờ",
        request=multipart_request(AccountDocumentReplaceForm),
        responses={200: AccountDocumentReadSerializer},
    ),
    partial_update=extend_schema(
        tags=["Account Documents"],
        summary="Cập nhật một phần giấy tờ",
        request=multipart_request(AccountDocumentReplaceForm),
        responses={200: AccountDocumentReadSerializer},
    ),
    destroy=extend_schema(tags=["Account Documents"], summary="Xóa giấy tờ"),
)
class AccountDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD giấy tờ tài khoản và thao tác duyệt từng giấy tờ."""

    queryset = AccountDocument.objects.select_related("account", "verified_by")
    serializer_class = AccountDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == "create":
            return AccountDocumentBulkUploadSerializer
        if self.action in ("list", "retrieve"):
            return AccountDocumentListSerializer
        return AccountDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        documents = serializer.save()
        for document in documents:
            _notify_admins_new_document(document, request.user)
        return Response(
            AccountDocumentReadSerializer(
                documents,
                many=True,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSupplierOrDealer()]
        if self.action == "verify":
            return [IsAdmin()]
        return [IsAdminOrSupplier()]

    def get_queryset(self):
        qs = self.queryset
        if self.request.user.role == "admin":
            account_id = self.request.query_params.get("account_id")
            if account_id:
                qs = qs.filter(account_id=account_id)
            return _apply_order(
                qs,
                ORDER_DOCUMENT_BY_ACCOUNT,
                pending_field="status",
            )
        if self.request.user.role == AccountRole.DEALER:
            return filter_admin_or_dealer_account(
                qs,
                self.request.user,
                account_lookup="account",
                ordering=ORDER_DOCUMENT,
                pending_field="status",
            )
        return filter_admin_or_supplier_account(
            qs,
            self.request.user,
            account_lookup="account",
            ordering=ORDER_DOCUMENT,
            pending_field="status",
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @extend_schema(
        tags=["Account Documents"],
        summary="Admin duyệt giấy tờ",
        description=(
            "Chỉ cần **document_id** — tài khoản suy ra từ khóa ngoại `account`.\n\n"
            "- URL `{id}` = **document id**\n"
            "- Body duyệt: `{ \"status\": \"approved\" }`\n"
            "- Body từ chối: `{ \"status\": \"rejected\", \"rejection_reason\": \"...\" }`"
            + VERIFY_REJECT_HELP
        ),
        request=VerifyAccountDocumentSerializer,
        responses={200: AccountDocumentListSerializer},
        examples=[DOCUMENT_VERIFY_APPROVE, DOCUMENT_VERIFY_REJECT],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        document = self.get_object()
        serializer = VerifyAccountDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = _apply_document_verification(
            document,
            request.user,
            serializer.validated_data["status"],
            rejection_reason=serializer.validated_data.get("rejection_reason", ""),
        )
        return Response(
            AccountDocumentListSerializer(
                document,
                context={"request": request},
            ).data
        )

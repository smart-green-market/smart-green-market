"""API ViewSet quản lý chứng nhận chất lượng và ảnh scan."""

from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.notification_messages import admin_new_certification, certification_reviewed
from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.verify_openapi import (
    CERT_REVOKE,
    CERT_VERIFY_APPROVE,
    CERT_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.pagination import paginate_queryset
from common.permission import IsAdmin, IsActive
from common.querysets import ORDER_IMAGE, ORDER_NEWEST, filter_admin_or_supplier_account
from .models import Certification, CertificationAuditAction, CertificationImage, CertificationStatus
from .openapi import (
    CertificationCreateForm,
    CertificationImageBulkUploadForm,
    CertificationImageReplaceForm,
    CertificationUpdateForm,
)
from .serializers import (
    CertificationAuditLogSerializer,
    CertificationCreateSerializer,
    CertificationImageBulkUploadSerializer,
    CertificationImageSerializer,
    CertificationListSerializer,
    CertificationSerializer,
    RevokeCertificationSerializer,
    VerifyCertificationSerializer,
    log_certification_action,
    mark_expired_certifications,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Certifications"],
        summary="Danh sách chứng nhận",
        description=(
            "Admin: thêm `?expired=true` để lọc chứng nhận hết hạn.\n"
            "Supplier/Dealer chỉ thấy chứng nhận của mình.\n"
            "Hệ thống tự kiểm tra ngày hết hạn khi gọi API."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                CertificationListSerializer,
                "PaginatedCertification",
            )
        },
    ),
    retrieve=extend_schema(
        tags=["Certifications"],
        summary="Chi tiết chứng nhận",
        responses={200: CertificationListSerializer},
    ),
    create=extend_schema(
        tags=["Certifications"],
        summary="Đăng ký chứng nhận mới (upload nhiều ảnh scan)",
        description=(
            "Supplier/Dealer đăng ký chứng nhận — `supplier` tự gắn theo JWT.\n"
            "Chọn ảnh scan trên Swagger (multipart/form-data, field `images`).\n"
            "Có thể chọn nhiều file cùng lúc.\n"
            f"Tối đa 5 ảnh/chứng nhận, 5MB/ảnh"
        ),
        request={"multipart/form-data": CertificationCreateForm},
        responses={201: CertificationSerializer},
    ),
    update=extend_schema(
        tags=["Certifications"],
        summary="Cập nhật thông tin chứng nhận",
        description="Chỉ cập nhật metadata. Ảnh scan quản lý qua `/api/certification-images/`.",
        request={"multipart/form-data": CertificationUpdateForm},
        responses={200: CertificationSerializer},
    ),
    partial_update=extend_schema(
        tags=["Certifications"],
        summary="Cập nhật một phần thông tin chứng nhận",
        description="Chỉ cập nhật metadata. Ảnh scan quản lý qua `/api/certification-images/`.",
        request={"multipart/form-data": CertificationUpdateForm},
        responses={200: CertificationSerializer},
    ),
    destroy=extend_schema(tags=["Certifications"], summary="Xóa chứng nhận"),
)
class CertificationViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD, duyệt và thu hồi chứng nhận chất lượng."""

    parser_classes = [MultiPartParser, FormParser]
    queryset = Certification.objects.select_related(
        "supplier", "supplier__account", "verified_by", "revoked_by"
    ).prefetch_related("images")
    serializer_class = CertificationSerializer

    def get_serializer_class(self):
        """Trả về serializer phù hợp theo action hiện tại."""
        if self.action == "create":
            return CertificationCreateSerializer
        if self.action in ("list", "retrieve", "verify", "revoke"):
            return CertificationListSerializer
        return CertificationSerializer

    def get_permissions(self):
        """Chỉ Admin được duyệt, thu hồi và xem lịch sử audit."""
        if self.action in ("verify", "revoke", "audit_history"):
            return [IsAdmin()]
        return [IsActive()]

    def get_queryset(self):
        """Lọc chứng nhận theo quyền và trạng thái hết hạn."""
        mark_expired_certifications()
        qs = self.queryset.filter(deleted_at__isnull=True)
        if self.request.user.role == "admin":
            if self.request.query_params.get("expired") == "true":
                return filter_admin_or_supplier_account(
                    qs.filter(status=CertificationStatus.EXPIRED),
                    self.request.user,
                    ordering=ORDER_NEWEST,
                )
            return filter_admin_or_supplier_account(
                qs,
                self.request.user,
                ordering=ORDER_NEWEST,
                pending_field="status",
            )
        return filter_admin_or_supplier_account(
            qs,
            self.request.user,
            ordering=ORDER_NEWEST,
            pending_field="status",
        )

    def create(self, request, *args, **kwargs):
        """Tạo chứng nhận mới kèm ảnh scan."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            CertificationListSerializer(
                serializer.instance,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        """Lưu chứng nhận, ghi audit log và thông báo Admin."""
        certification = serializer.save()
        log_certification_action(
            certification,
            CertificationAuditAction.SUBMITTED,
            self.request.user,
            "Nộp chứng nhận mới.",
        )
        title, content = admin_new_certification(certification)
        notify_admins(
            title=title,
            content=content,
            reference_type="certification",
            reference_id=certification.id,
            created_by=self.request.user,
        )

    @extend_schema(
        tags=["Certifications"],
        summary="Admin duyệt / từ chối chứng nhận",
        description=(
            "`rejected` bắt buộc kèm `rejection_reason`."
            + VERIFY_REJECT_HELP
        ),
        request=VerifyCertificationSerializer,
        responses={200: CertificationListSerializer},
        examples=[CERT_VERIFY_APPROVE, CERT_VERIFY_REJECT],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Admin duyệt hoặc từ chối chứng nhận và thông báo nhà cung cấp."""
        certification = self.get_object()
        serializer = VerifyCertificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        certification.status = new_status
        certification.rejection_reason = serializer.validated_data.get(
            "rejection_reason", ""
        )
        certification.verified_by = request.user
        certification.verified_at = timezone.now()
        certification.save()

        action = (
            CertificationAuditAction.APPROVED
            if new_status == CertificationStatus.APPROVED
            else CertificationAuditAction.REJECTED
        )
        log_certification_action(
            certification,
            action,
            request.user,
            certification.rejection_reason,
        )

        title, content, notif_type = certification_reviewed(certification)
        notify_account(
            account=certification.supplier.account,
            title=title,
            content=content,
            reference_type="certification",
            reference_id=certification.id,
            created_by=request.user,
            notif_type=notif_type,
        )
        return Response(
            CertificationListSerializer(
                certification,
                context={"request": request},
            ).data
        )

    @extend_schema(
        tags=["Certifications"],
        summary="Admin thu hồi chứng nhận không hợp lệ",
        description="`revoke_reason` bắt buộc, không được để trống.",
        request=RevokeCertificationSerializer,
        responses={200: CertificationListSerializer},
        examples=[CERT_REVOKE],
    )
    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        """Admin thu hồi chứng nhận không hợp lệ và soft-delete."""
        certification = self.get_object()
        serializer = RevokeCertificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["revoke_reason"]
        certification.status = CertificationStatus.REVOKED
        certification.revoke_reason = reason
        certification.revoked_by = request.user
        certification.revoked_at = timezone.now()
        certification.deleted_at = timezone.now()
        certification.save()

        log_certification_action(
            certification,
            CertificationAuditAction.REVOKED,
            request.user,
            reason,
        )
        notify_account(
            account=certification.supplier.account,
            title=f"[Chứng nhận] \"{certification.name}\" — Thu hồi",
            content=(
                f"Chứng nhận {certification.name} đã bị thu hồi. Lý do: {reason}"
            ),
            reference_type="certification",
            reference_id=certification.id,
            created_by=request.user,
            notif_type="error",
        )
        return Response(
            CertificationListSerializer(
                certification,
                context={"request": request},
            ).data
        )

    @extend_schema(
        tags=["Certifications"],
        summary="Xem lịch sử duyệt chứng nhận",
        description=PAGINATION_QUERY_HELP.strip(),
        responses={
            200: paginated_response_schema(
                CertificationAuditLogSerializer,
                "PaginatedCertificationAuditLog",
            )
        },
    )
    @action(detail=True, methods=["get"], url_path="audit-history")
    def audit_history(self, request, pk=None):
        """Trả về lịch sử duyệt/thu hồi của chứng nhận."""
        certification = self.get_object()
        logs = certification.audit_logs.select_related("performed_by").order_by(
            "-created_at"
        )

        def serialize(page):
            """Chuyển trang audit log sang dict."""
            return CertificationAuditLogSerializer(page, many=True).data

        return paginate_queryset(self, request, logs, serialize)


@extend_schema_view(
    list=extend_schema(
        tags=["Certification Images"],
        summary="Danh sách ảnh chứng nhận",
        description=(
            "Admin xem tất cả. Supplier/Dealer chỉ thấy ảnh chứng nhận của mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                CertificationImageSerializer,
                "PaginatedCertificationImage",
            )
        },
    ),
    retrieve=extend_schema(tags=["Certification Images"], summary="Chi tiết ảnh"),
    create=extend_schema(
        tags=["Certification Images"],
        summary="Upload ảnh chứng nhận (1 hoặc nhiều ảnh)",
        description=(
            "Thêm ảnh scan cho chứng nhận đã tạo (multipart/form-data, field `images`).\n"
            "Có thể chọn nhiều file cùng lúc."
        ),
        request={"multipart/form-data": CertificationImageBulkUploadForm},
        responses={201: CertificationImageSerializer(many=True)},
    ),
    update=extend_schema(
        tags=["Certification Images"],
        summary="Thay ảnh chứng nhận",
        request={"multipart/form-data": CertificationImageReplaceForm},
        responses={200: CertificationImageSerializer},
    ),
    partial_update=extend_schema(
        tags=["Certification Images"],
        summary="Cập nhật một phần (ảnh / thứ tự)",
        request={"multipart/form-data": CertificationImageReplaceForm},
        responses={200: CertificationImageSerializer},
    ),
    destroy=extend_schema(tags=["Certification Images"], summary="Xóa ảnh"),
)
class CertificationImageViewSet(viewsets.ModelViewSet):
    """ViewSet upload và quản lý ảnh scan chứng nhận."""

    permission_classes = [IsActive]
    parser_classes = [MultiPartParser, FormParser]
    queryset = CertificationImage.objects.select_related(
        "certification__supplier__account"
    )
    serializer_class = CertificationImageSerializer

    def get_serializer_class(self):
        """Dùng serializer bulk upload khi tạo nhiều ảnh."""
        if self.action == "create":
            return CertificationImageBulkUploadSerializer
        return CertificationImageSerializer

    def create(self, request, *args, **kwargs):
        """Upload một hoặc nhiều ảnh scan chứng nhận."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        images = serializer.save()
        return Response(
            CertificationImageSerializer(
                images,
                many=True,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def get_queryset(self):
        """Lọc ảnh theo quyền Admin hoặc nhà cung cấp sở hữu chứng nhận."""
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            account_lookup="certification__supplier__account",
            ordering=ORDER_IMAGE,
        )

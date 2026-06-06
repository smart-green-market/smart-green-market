from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.notification_messages import admin_new_certification, certification_reviewed
from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.pagination import paginate_queryset
from common.permission import IsAdmin, IsActive
from .models import Certification, CertificationAuditAction, CertificationStatus
from .openapi import CertificationCreateForm, CertificationUpdateForm
from .serializers import (
    CertificationAuditLogSerializer,
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
            "Hệ thống tự kiểm tra ngày hết hạn khi gọi API."
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(CertificationSerializer, "PaginatedCertification")
        },
    ),
    retrieve=extend_schema(tags=["Certifications"], summary="Chi tiết chứng nhận"),
    create=extend_schema(
        tags=["Certifications"],
        summary="Đăng ký chứng nhận mới (upload ảnh scan)",
        description=(
            "Chọn ảnh scan chứng nhận trực tiếp trên Swagger (multipart/form-data).\n"
            "Định dạng: jpg, png, webp — tối đa 5MB."
        ),
        request={"multipart/form-data": CertificationCreateForm},
        responses={201: CertificationSerializer},
    ),
    update=extend_schema(
        tags=["Certifications"],
        summary="Cập nhật chứng nhận",
        description="Có thể thay ảnh scan qua field `file_url` (multipart/form-data).",
        request={"multipart/form-data": CertificationUpdateForm},
        responses={200: CertificationSerializer},
    ),
    partial_update=extend_schema(
        tags=["Certifications"],
        summary="Cập nhật một phần chứng nhận",
        description="Có thể upload ảnh scan mới qua field `file_url` (multipart/form-data).",
        request={"multipart/form-data": CertificationUpdateForm},
        responses={200: CertificationSerializer},
    ),
    destroy=extend_schema(tags=["Certifications"], summary="Xóa chứng nhận"),
)
class CertificationViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    queryset = Certification.objects.select_related(
        "supplier", "supplier__account", "verified_by", "revoked_by"
    )
    serializer_class = CertificationSerializer

    def get_permissions(self):
        if self.action in ("verify", "revoke", "audit_history"):
            return [IsAdmin()]
        return [IsActive()]

    def get_queryset(self):
        mark_expired_certifications()
        qs = self.queryset.filter(deleted_at__isnull=True)
        if self.request.user.role == "admin":
            if self.request.query_params.get("expired") == "true":
                return qs.filter(status=CertificationStatus.EXPIRED)
            return qs
        if hasattr(self.request.user, "supplier_profile"):
            return qs.filter(supplier=self.request.user.supplier_profile)
        return qs.none()

    def perform_create(self, serializer):
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
        request=VerifyCertificationSerializer,
        responses={200: CertificationSerializer},
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
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
        return Response(CertificationSerializer(certification).data)

    @extend_schema(
        tags=["Certifications"],
        summary="Admin thu hồi chứng nhận không hợp lệ",
        request=RevokeCertificationSerializer,
        responses={200: CertificationSerializer},
    )
    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
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
        return Response(CertificationSerializer(certification).data)

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
        certification = self.get_object()
        logs = certification.audit_logs.select_related("performed_by").order_by(
            "-created_at"
        )

        def serialize(page):
            return CertificationAuditLogSerializer(page, many=True).data

        return paginate_queryset(self, request, logs, serialize)

from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permission import IsAdmin, IsActive
from .models import Certification
from .serializers import CertificationSerializer, VerifyCertificationSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Certifications"],
        summary="Danh sách chứng nhận",
        description="Chứng nhận chất lượng/organic của supplier.",
        responses={200: CertificationSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Certifications"],
        summary="Chi tiết chứng nhận",
        responses={200: CertificationSerializer},
    ),
    create=extend_schema(
        tags=["Certifications"],
        summary="Đăng ký chứng nhận mới",
        description=(
            "Supplier tạo chứng nhận với `status=pending`.\n"
            "Gửi `file_url` (URL file scan chứng nhận), ngày cấp/hết hạn."
        ),
        request=CertificationSerializer,
        responses={201: CertificationSerializer},
    ),
    update=extend_schema(tags=["Certifications"], summary="Cập nhật toàn bộ chứng nhận"),
    partial_update=extend_schema(tags=["Certifications"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Certifications"], summary="Xóa chứng nhận"),
)
class CertificationViewSet(viewsets.ModelViewSet):
    queryset = Certification.objects.select_related("supplier", "verified_by")
    serializer_class = CertificationSerializer

    def get_permissions(self):
        if self.action == "verify":
            return [IsAdmin()]
        return [IsActive()]

    @extend_schema(
        tags=["Certifications"],
        summary="Admin duyệt chứng nhận",
        description=(
            "Chỉ Admin. `status`: `approved` hoặc `rejected`.\n"
            "Nếu từ chối, gửi kèm `rejection_reason`."
        ),
        request=VerifyCertificationSerializer,
        responses={200: CertificationSerializer},
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        certification = self.get_object()
        serializer = VerifyCertificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        certification.status = serializer.validated_data["status"]
        certification.rejection_reason = serializer.validated_data.get(
            "rejection_reason", ""
        )
        certification.verified_by = request.user
        certification.verified_at = timezone.now()
        certification.save()
        return Response(CertificationSerializer(certification).data)

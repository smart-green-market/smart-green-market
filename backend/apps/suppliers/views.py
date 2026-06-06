from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.supplier_products.models import SupplierProduct
from common.openapi import VerifySupplierSerializer
from common.permission import IsAdmin, IsSupplier
from apps.notifications.models import Notification, NotificationReceipt
from .models import Supplier, SupplierDocument
from .serializers import (
    SupplierSerializer,
    SupplierDetailSerializer,
    SupplierDocumentSerializer,
    VerifySupplierDocumentSerializer,
)

User = get_user_model()

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


@extend_schema_view(
    list=extend_schema(
        tags=["Suppliers"],
        summary="Danh sách nhà cung cấp",
        description="Admin xem tất cả. Supplier chỉ thấy hồ sơ của mình.",
        responses={200: SupplierSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Suppliers"],
        summary="Chi tiết nhà cung cấp",
        description=(
            "Trả về đầy đủ thông tin supplier kèm các dữ liệu liên quan:\n"
            "- `account` — profile tài khoản\n"
            "- `documents` — giấy tờ đã upload\n"
            "- `certifications` — chứng nhận chất lượng\n"
            "- `products` — danh sách sản phẩm (kèm ảnh)"
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
        if self.action in ["create", "update", "partial_update"]:
            return [IsSupplier()]
        if self.action in ["verify"]:
            return [IsAdmin()]
        return [IsSupplier()]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if self.action == "retrieve":
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
        summary="Admin duyệt nhà cung cấp",
        description=(
            "Chỉ Admin. Cập nhật `verification_status` và gửi thông báo cho supplier.\n\n"
            "Giá trị: `pending` | `approved` | `rejected`"
        ),
        request=VerifySupplierSerializer,
        responses={200: SupplierSerializer},
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        supplier = self.get_object()
        new_status = request.data.get("verification_status")
        supplier.verification_status = new_status
        supplier.save()
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
        return Response(SupplierSerializer(supplier).data)


@extend_schema_view(
    list=extend_schema(
        tags=["Supplier Documents"],
        summary="Danh sách giấy tờ",
        description="Admin xem tất cả. Supplier chỉ thấy giấy tờ của mình.",
        responses={200: SupplierDocumentSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Supplier Documents"],
        summary="Chi tiết giấy tờ",
        responses={200: SupplierDocumentSerializer},
    ),
    create=extend_schema(
        tags=["Supplier Documents"],
        summary="Upload giấy tờ",
        description=(
            "**Upload multipart/form-data** sau khi đã tạo supplier profile.\n\n"
            "**Fields:**\n"
            "- `document_type`: `business_license` | `id_card` | `tax_certificate`\n"
            "- `file_url`: file PDF/JPG/PNG\n\n"
            "Mỗi supplier chỉ upload **1 file / loại giấy tờ**. "
            "Admin nhận thông báo khi có giấy tờ mới."
        ),
        request=SupplierDocumentSerializer,
        responses={201: SupplierDocumentSerializer},
    ),
    update=extend_schema(tags=["Supplier Documents"], summary="Thay thế giấy tờ"),
    partial_update=extend_schema(tags=["Supplier Documents"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Supplier Documents"], summary="Xóa giấy tờ"),
)
class SupplierDocumentViewSet(viewsets.ModelViewSet):
    queryset = SupplierDocument.objects.select_related("supplier", "verified_by")
    serializer_class = SupplierDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        admins = User.objects.filter(role="admin")
        notification = Notification.objects.create(
            title="New supplier document pending",
            content=f"Supplier {document.supplier.id} uploaded a document waiting for review",
            type="info",
            reference_type="supplier_document",
            reference_id=document.id,
            created_by=request.user,
        )
        NotificationReceipt.objects.bulk_create([
            NotificationReceipt(notification=notification, account=admin)
            for admin in admins
        ])
        return Response(
            SupplierDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSupplier()]
        if self.action == "verify":
            return [IsAdmin()]
        return [IsSupplier()]

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
        description="Chỉ Admin. Cập nhật `status` thành `approved` hoặc `rejected`, gửi thông báo cho supplier.",
        request=VerifySupplierDocumentSerializer,
        responses={200: SupplierDocumentSerializer},
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        document = self.get_object()
        serializer = VerifySupplierDocumentSerializer(document, data=request.data)
        serializer.is_valid(raise_exception=True)
        document.status = serializer.validated_data["status"]
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.save()
        supplier_user = document.supplier.account
        notification = Notification.objects.create(
            title="Supplier document updated",
            content=f"Your document was {document.status}",
            type="success" if document.status == "approved" else "error",
            reference_type="supplier_document",
            reference_id=document.id,
            created_by=request.user,
        )
        NotificationReceipt.objects.create(
            notification=notification,
            account=supplier_user,
        )
        return Response(SupplierDocumentSerializer(document).data)

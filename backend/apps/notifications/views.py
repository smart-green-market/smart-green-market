from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.notification_messages import (
    notification_type_label,
    reference_type_label,
)
from common.openapi import (
    MarkReadResponseSerializer,
    MessageResponseSerializer,
    MyNotificationItemSerializer,
    PAGINATION_QUERY_HELP,
    paginated_response_schema,
)
from common.pagination import paginate_queryset
from common.permission import IsAdmin
from apps.accounts.models import AccountRole
from .models import Notification, NotificationReceipt
from .serializers import NotificationSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Notifications"],
        summary="Danh sách thông báo (toàn hệ thống)",
        description=(
            "Chỉ Admin. User thường dùng `/my/` để xem thông báo của mình."
            + PAGINATION_QUERY_HELP
        ),
        responses={200: paginated_response_schema(NotificationSerializer, "PaginatedNotification")},
    ),
    retrieve=extend_schema(
        tags=["Notifications"],
        summary="Chi tiết thông báo",
        responses={200: NotificationSerializer},
    ),
    create=extend_schema(
        tags=["Notifications"],
        summary="Tạo thông báo",
        description="Tạo thông báo mới (thường dùng nội bộ hệ thống).",
        request=NotificationSerializer,
        responses={201: NotificationSerializer},
    ),
    update=extend_schema(tags=["Notifications"], summary="Cập nhật thông báo"),
    partial_update=extend_schema(tags=["Notifications"], summary="Cập nhật một phần"),
    destroy=extend_schema(tags=["Notifications"], summary="Xóa thông báo"),
)
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer

    def get_queryset(self):
        if self.action == "my":
            return self.queryset
        if self.request.user.role == AccountRole.ADMIN:
            return self.queryset.order_by("-created_at", "-id")
        return Notification.objects.none()

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return super().get_permissions()

    @extend_schema(
        tags=["Notifications"],
        summary="Thông báo của tôi",
        description=(
            "Lấy danh sách thông báo gửi đến user đăng nhập, sắp xếp mới nhất trước.\n\n"
            "- `read_at=null`: chưa đọc\n"
            "- `type_label`: loại thông báo (Thông tin / Thành công / ...)\n"
            "- `reference_type_label`: nhóm nội dung (Giấy tờ / Danh mục / ...)"
            + PAGINATION_QUERY_HELP
        ),
        responses={
            200: paginated_response_schema(
                MyNotificationItemSerializer,
                "PaginatedMyNotification",
            )
        },
    )
    @action(detail=False, methods=["get"])
    def my(self, request):
        receipts = NotificationReceipt.objects.filter(
            account=request.user
        ).select_related("notification").order_by("-notification__created_at")

        def serialize(page):
            return [
                {
                    "receipt_id": r.id,
                    "id": r.notification.id,
                    "title": r.notification.title,
                    "content": r.notification.content,
                    "type": r.notification.type,
                    "type_label": notification_type_label(r.notification.type),
                    "reference_type": r.notification.reference_type,
                    "reference_type_label": reference_type_label(
                        r.notification.reference_type
                    ),
                    "reference_id": r.notification.reference_id,
                    "read_at": r.read_at,
                    "created_at": r.notification.created_at,
                }
                for r in page
            ]

        return paginate_queryset(self, request, receipts, serialize)

    @extend_schema(
        tags=["Notifications"],
        summary="Đánh dấu đã đọc",
        description="Đánh dấu 1 thông báo đã đọc cho user hiện tại.",
        responses={200: MarkReadResponseSerializer},
    )
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        updated = NotificationReceipt.objects.filter(
            notification_id=pk,
            account=request.user,
        ).update(read_at=timezone.now())
        return Response({
            "message": "Đã đánh dấu đọc",
            "notification_id": pk,
            "updated": updated,
        })

    @extend_schema(
        tags=["Notifications"],
        summary="Đánh dấu tất cả đã đọc",
        description="Đánh dấu toàn bộ thông báo chưa đọc của user hiện tại.",
        responses={200: MessageResponseSerializer},
    )
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        NotificationReceipt.objects.filter(
            account=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"message": "Đã đánh dấu đọc tất cả thông báo"})

from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.openapi import MarkReadResponseSerializer, MessageResponseSerializer, MyNotificationItemSerializer
from .models import Notification, NotificationReceipt
from .serializers import NotificationSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Notifications"],
        summary="Danh sách thông báo (toàn hệ thống)",
        description="Trả về tất cả notification trong DB. Thường dùng `/my/` thay endpoint này.",
        responses={200: NotificationSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Notifications"],
        summary="Chi tiết thông báo",
        responses={200: NotificationSerializer},
    ),
    create=extend_schema(
        tags=["Notifications"],
        summary="Tạo thông báo",
        description="Tạo notification mới (thường dùng nội bộ hệ thống).",
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

    @extend_schema(
        tags=["Notifications"],
        summary="Thông báo của tôi",
        description=(
            "Lấy danh sách thông báo gửi đến user đăng nhập.\n"
            "`read_at=null` nghĩa là chưa đọc."
        ),
        responses={200: MyNotificationItemSerializer(many=True)},
    )
    @action(detail=False, methods=["get"])
    def my(self, request):
        receipts = NotificationReceipt.objects.filter(
            account=request.user
        ).select_related("notification")

        data = [
            {
                "receipt_id": r.id,
                "id": r.notification.id,
                "title": r.notification.title,
                "content": r.notification.content,
                "type": r.notification.type,
                "reference_type": r.notification.reference_type,
                "reference_id": r.notification.reference_id,
                "read_at": r.read_at,
                "created_at": r.notification.created_at,
            }
            for r in receipts
        ]
        return Response(data)

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
            "message": "marked as read",
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
        return Response({"message": "all marked as read"})

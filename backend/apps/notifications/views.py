"""API ViewSet quản lý thông báo hệ thống."""

from django.db.models import Case, IntegerField, Value, When
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
    PAGINATION_QUERY_HELP,
    my_notification_list_response_schema,
    paginated_response_schema,
)
from common.pagination import paginate_queryset
from common.permission import IsAdmin
from apps.accounts.models import AccountRole
from .models import Notification, NotificationReceipt
from .serializers import NotificationSerializer


def serialize_notification_receipt(receipt, purchase_orders_by_id=None, customer_orders_by_id=None):
    """Chuyển biên nhận thông báo sang dict cho API."""
    notification = receipt.notification
    data = {
        "receipt_id": receipt.id,
        "id": notification.id,
        "title": notification.title,
        "content": notification.content,
        "type": notification.type,
        "type_label": notification_type_label(notification.type),
        "reference_type": notification.reference_type,
        "reference_type_label": reference_type_label(notification.reference_type),
        "reference_id": notification.reference_id,
        "read_at": receipt.read_at,
        "created_at": notification.created_at,
        "reference_status": None,
        "reference_order_code": None,
    }
    if notification.reference_type == "purchase_order" and notification.reference_id:
        order = None
        if purchase_orders_by_id is not None:
            order = purchase_orders_by_id.get(notification.reference_id)
        if order is not None:
            data["reference_status"] = order.status
            data["reference_order_code"] = order.order_code
    if notification.reference_type == "customer_order" and notification.reference_id:
        order = None
        if customer_orders_by_id is not None:
            order = customer_orders_by_id.get(notification.reference_id)
        if order is not None:
            data["reference_status"] = order.status
            data["reference_order_code"] = order.order_code
    return data


def serialize_notification_receipts(receipts):
    """Chuyển danh sách biên nhận thông báo sang list dict."""
    po_ids = [
        r.notification.reference_id
        for r in receipts
        if r.notification.reference_type == "purchase_order" and r.notification.reference_id
    ]
    co_ids = [
        r.notification.reference_id
        for r in receipts
        if r.notification.reference_type == "customer_order" and r.notification.reference_id
    ]
    purchase_orders_by_id = {}
    if po_ids:
        from apps.purchase_orders.models import PurchaseOrder

        purchase_orders_by_id = {
            o.id: o
            for o in PurchaseOrder.objects.filter(id__in=po_ids).only(
                "id", "status", "order_code"
            )
        }
    customer_orders_by_id = {}
    if co_ids:
        from apps.orders.models import Order

        customer_orders_by_id = {
            o.id: o
            for o in Order.objects.filter(id__in=co_ids).only(
                "id", "status", "order_code"
            )
        }
    return [
        serialize_notification_receipt(
            r,
            purchase_orders_by_id,
            customer_orders_by_id,
        )
        for r in receipts
    ]


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
    """ViewSet quản lý thông báo và đánh dấu đã đọc."""

    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer

    def get_queryset(self):
        """Admin xem toàn bộ; action `my` dùng queryset riêng."""
        if self.action == "my":
            return self.queryset
        if self.request.user.role == AccountRole.ADMIN:
            return self.queryset.order_by("-created_at", "-id")
        return Notification.objects.none()

    def get_permissions(self):
        """Chỉ Admin được CRUD thông báo toàn hệ thống."""
        if self.action in ("list", "retrieve", "create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return super().get_permissions()

    @extend_schema(
        tags=["Notifications"],
        summary="Thông báo của tôi",
        description=(
            "Lấy danh sách thông báo gửi đến user đăng nhập, sắp xếp mới nhất trước.\n\n"
            "- `unread_count` + `unread[]`: thông báo chưa đọc (badge / dropdown)\n"
            "- `results[]`: chưa đọc lên trước, sau đó mới nhất trước trong từng nhóm\n"
            "- `read_at=null`: chưa đọc\n"
            "- `type_label`: loại thông báo (Thông tin / Thành công / ...)\n"
            "- `reference_type_label`: nhóm nội dung (Giấy tờ / Danh mục / ...)"
            + PAGINATION_QUERY_HELP
        ),
        responses={200: my_notification_list_response_schema()},
    )
    @action(detail=False, methods=["get"])
    def my(self, request):
        """Trả về thông báo của user hiện tại kèm số chưa đọc."""
        receipts = (
            NotificationReceipt.objects.filter(account=request.user)
            .select_related("notification")
            .annotate(
                _unread_priority=Case(
                    When(read_at__isnull=True, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by("_unread_priority", "-notification__created_at", "-id")
        )

        unread_receipts = list(receipts.filter(read_at__isnull=True))
        response = paginate_queryset(
            self,
            request,
            receipts,
            serialize_notification_receipts,
        )
        response.data = {
            "unread_count": len(unread_receipts),
            "unread": serialize_notification_receipts(unread_receipts),
            **response.data,
        }
        return response

    @extend_schema(
        tags=["Notifications"],
        summary="Đánh dấu đã đọc",
        description="Đánh dấu 1 thông báo đã đọc cho user hiện tại.",
        responses={200: MarkReadResponseSerializer},
    )
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Đánh dấu một thông báo đã đọc cho user hiện tại."""
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
        """Đánh dấu tất cả thông báo chưa đọc của user hiện tại."""
        NotificationReceipt.objects.filter(
            account=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"message": "Đã đánh dấu đọc tất cả thông báo"})

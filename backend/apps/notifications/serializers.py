"""Serializer cho thông báo hệ thống."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from common.openapi_enums import schema_choice_field
from common.notification_messages import notification_type_label, reference_type_label
from .models import Notification, NotificationReceipt


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer tạo và đọc thông báo hệ thống."""

    type_label = serializers.SerializerMethodField()
    reference_type_label = serializers.SerializerMethodField()
    type = schema_choice_field(choices=Notification.TYPE_CHOICES)

    class Meta:
        """Cấu hình trường thông báo."""

        model = Notification
        fields = "__all__"
        extra_kwargs = {
            "title": {"help_text": "Tiêu đề thông báo"},
            "content": {"help_text": "Nội dung chi tiết"},
            "reference_type": {
                "help_text": (
                    "Nhóm đối tượng: account_document | purchase_order | supplier | dealer | "
                    "category | certification | supplier_product | dealer_product"
                ),
            },
            "reference_id": {"help_text": "ID đối tượng liên quan"},
            "created_by": {"help_text": "ID tài khoản tạo thông báo (admin hoặc hệ thống)"},
            "created_at": {"help_text": "Thời gian tạo thông báo"},
        }

    @extend_schema_field(serializers.CharField())
    def get_type_label(self, obj):
        """Trả về nhãn tiếng Việt của loại thông báo."""
        return notification_type_label(obj.type)

    @extend_schema_field(serializers.CharField())
    def get_reference_type_label(self, obj):
        """Trả về nhãn tiếng Việt của nhóm đối tượng liên quan."""
        return reference_type_label(obj.reference_type)


class NotificationReceiptSerializer(serializers.ModelSerializer):
    """Serializer biên nhận thông báo gửi đến từng tài khoản."""

    class Meta:
        """Cấu hình trường biên nhận thông báo."""

        model = NotificationReceipt
        fields = "__all__"
        extra_kwargs = {
            "notification": {"help_text": "ID thông báo gốc"},
            "account": {"help_text": "ID tài khoản nhận thông báo"},
            "read_at": {"help_text": "Thời điểm đọc (null = chưa đọc)"},
            "created_at": {"help_text": "Thời điểm gửi thông báo đến tài khoản"},
        }

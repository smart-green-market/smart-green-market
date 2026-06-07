from rest_framework import serializers

from common.openapi_enums import schema_choice_field
from common.notification_messages import notification_type_label, reference_type_label
from .models import Notification, NotificationReceipt


class NotificationSerializer(serializers.ModelSerializer):
    type_label = serializers.SerializerMethodField()
    reference_type_label = serializers.SerializerMethodField()
    type = schema_choice_field(choices=Notification.TYPE_CHOICES)

    class Meta:
        model = Notification
        fields = "__all__"
        extra_kwargs = {
            "title": {"help_text": "Tiêu đề thông báo"},
            "content": {"help_text": "Nội dung chi tiết"},
            "reference_type": {
                "help_text": "Nhóm đối tượng: supplier_document, supplier, category, certification",
            },
            "reference_id": {"help_text": "ID đối tượng liên quan"},
        }

    def get_type_label(self, obj):
        return notification_type_label(obj.type)

    def get_reference_type_label(self, obj):
        return reference_type_label(obj.reference_type)


class NotificationReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationReceipt
        fields = "__all__"

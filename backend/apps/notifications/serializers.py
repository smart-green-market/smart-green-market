from rest_framework import serializers
from .models import Notification, NotificationReceipt


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class NotificationReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationReceipt
        fields = "__all__"
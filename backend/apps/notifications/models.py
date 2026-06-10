"""Model thông báo hệ thống và biên nhận theo tài khoản."""

from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Thông báo gửi đến người dùng trong hệ thống."""

    TYPE_CHOICES = [
        ("info", "Thông tin"),
        ("warning", "Cảnh báo"),
        ("success", "Thành công"),
        ("error", "Thất bại"),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    reference_type = models.CharField(max_length=50, null=True, blank=True)
    reference_id = models.IntegerField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_notifications"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Cấu hình thứ tự mặc định theo thời gian tạo."""

        ordering = ["-created_at"]


class NotificationReceipt(models.Model):
    """Biên nhận thông báo gửi đến từng tài khoản, kèm trạng thái đọc."""

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    account = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Mỗi tài khoản chỉ nhận một biên nhận cho mỗi thông báo."""

        unique_together = ("notification", "account")
        ordering = ["-notification__created_at"]

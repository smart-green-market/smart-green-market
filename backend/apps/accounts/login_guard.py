"""Cơ chế khóa tạm thời tài khoản khi đăng nhập sai nhiều lần."""

from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.system_config.services import get_system_settings
from .models import LoginAttempt


def check_login_allowed(username):
    """Kiểm tra username có bị khóa đăng nhập hay không, tự mở khóa nếu đã hết hạn."""
    attempt, _ = LoginAttempt.objects.get_or_create(username=username)
    settings = get_system_settings()
    if attempt.locked_until and attempt.locked_until > timezone.now():
        remaining = attempt.locked_until - timezone.now()
        minutes = max(1, int(remaining.total_seconds() // 60) + 1)
        raise ValidationError(
            f"Đăng nhập sai quá {settings.max_login_attempts} lần. "
            f"Vui lòng thử lại sau {minutes} phút.",
            code="account_locked",
        )
    if attempt.locked_until and attempt.locked_until <= timezone.now():
        attempt.failed_count = 0
        attempt.locked_until = None
        attempt.save(update_fields=["failed_count", "locked_until", "updated_at"])


def record_failed_login(username):
    """Ghi nhận một lần đăng nhập thất bại và khóa tài khoản nếu vượt ngưỡng."""
    attempt, _ = LoginAttempt.objects.get_or_create(username=username)
    settings = get_system_settings()
    attempt.failed_count += 1
    if attempt.failed_count >= settings.max_login_attempts:
        attempt.locked_until = timezone.now() + timedelta(
            minutes=settings.login_lockout_minutes
        )
        attempt.failed_count = 0
    attempt.save()


def reset_login_attempts(username):
    """Xóa bộ đếm lần đăng nhập sai sau khi đăng nhập thành công."""
    LoginAttempt.objects.filter(username=username).update(
        failed_count=0,
        locked_until=None,
    )

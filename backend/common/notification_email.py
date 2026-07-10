"""Gửi thông báo hệ thống qua email (bất đồng bộ, không chặn request)."""

import logging
import threading

from django.conf import settings
from django.core.mail import send_mail

from common.notification_messages import notification_type_label

logger = logging.getLogger(__name__)


def _is_email_enabled():
    return getattr(settings, "NOTIFICATION_EMAIL_ENABLED", False)


def _recipient_email(account):
    email = (getattr(account, "email", None) or "").strip()
    return email or None


def _build_email_bodies(title, content, notif_type):
    type_label = notification_type_label(notif_type)
    text = (
        f"Loại: {type_label}\n\n"
        f"{title}\n\n"
        f"{content}\n\n"
        f"---\n"
        f"Smart Green Market"
    )
    html = (
        "<div style=\"font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a;\">"
        f"<p style=\"color:#666;font-size:12px;margin:0 0 16px;\">Loại: {type_label}</p>"
        f"<h2 style=\"margin:0 0 12px;font-size:18px;\">{title}</h2>"
        f"<p style=\"margin:0 0 24px;line-height:1.5;\">{content}</p>"
        "<hr style=\"border:none;border-top:1px solid #e5e5e5;margin:24px 0;\">"
        "<p style=\"color:#888;font-size:12px;margin:0;\">Smart Green Market</p>"
        "</div>"
    )
    return text, html


def _do_send(recipient, subject, message, html_message):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception:
        logger.exception("Gửi email thông báo thất bại tới %s", recipient)


def send_notification_email(account, *, title, content, notif_type="info"):
    """Gửi email thông báo cho một tài khoản (đồng bộ)."""
    if not _is_email_enabled():
        return
    recipient = _recipient_email(account)
    if not recipient:
        return
    text, html = _build_email_bodies(title, content, notif_type)
    _do_send(recipient, title, text, html)


def send_notification_email_async(account, *, title, content, notif_type="info"):
    """Gửi email thông báo — async qua thread nếu bật, ngược lại gửi đồng bộ."""
    if not _is_email_enabled():
        return
    recipient = _recipient_email(account)
    if not recipient:
        return
    text, html = _build_email_bodies(title, content, notif_type)

    if getattr(settings, "NOTIFICATION_EMAIL_ASYNC", True):
        thread = threading.Thread(
            target=_do_send,
            args=(recipient, title, text, html),
            daemon=True,
        )
        thread.start()
        return

    _do_send(recipient, title, text, html)

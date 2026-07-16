from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings

from common.notification_email import send_notification_email, send_notification_email_async
from common.notifications import notify_account

User = get_user_model()


@override_settings(
    NOTIFICATION_EMAIL_ENABLED=True,
    NOTIFICATION_EMAIL_ASYNC=False,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@test.com",
)
class NotificationEmailTests(TestCase):
    def setUp(self):
        self.account = User.objects.create_user(
            username="supplier01",
            email="supplier01@example.com",
            password="pass",
            role="supplier",
        )

    def test_send_notification_email_delivers_to_recipient(self):
        send_notification_email(
            self.account,
            title="[Sản phẩm] Test",
            content="Sản phẩm mới cần duyệt",
            notif_type="info",
        )
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["supplier01@example.com"])
        self.assertEqual(message.subject, "[Sản phẩm] Test")
        self.assertIn("Sản phẩm mới cần duyệt", message.body)
        self.assertIn("Thông tin", message.body)

    def test_send_notification_email_skipped_when_disabled(self):
        with override_settings(NOTIFICATION_EMAIL_ENABLED=False):
            send_notification_email(
                self.account,
                title="Test",
                content="Nội dung",
            )
        self.assertEqual(len(mail.outbox), 0)

    def test_send_notification_email_skipped_without_email(self):
        self.account.email = ""
        self.account.save(update_fields=["email"])
        send_notification_email(
            self.account,
            title="Test",
            content="Nội dung",
        )
        self.assertEqual(len(mail.outbox), 0)

    @patch("common.notification_email.threading.Thread")
    def test_send_notification_email_async_uses_thread(self, mock_thread_cls):
        mock_thread = mock_thread_cls.return_value
        with override_settings(NOTIFICATION_EMAIL_ASYNC=True):
            send_notification_email_async(
                self.account,
                title="Test async",
                content="Nội dung async",
            )
        mock_thread_cls.assert_called_once()
        mock_thread.start.assert_called_once()

    @override_settings(NOTIFICATION_EMAIL_ASYNC=False)
    def test_notify_account_sends_email(self):
        notify_account(
            account=self.account,
            title="[Phiếu nhập] PO-001",
            content="Phiếu nhập đã xác nhận",
            reference_type="purchase_order",
            reference_id=1,
            created_by=self.account,
            notif_type="success",
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "[Phiếu nhập] PO-001")

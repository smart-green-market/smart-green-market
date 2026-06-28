"""Tests mã cửa hàng đại lý."""

from django.test import TestCase

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.dealers.store_code import STORE_CODE_PATTERN, generate_store_code


class StoreCodeTests(TestCase):
    def test_generate_store_code_format(self):
        code = generate_store_code()
        self.assertRegex(code, STORE_CODE_PATTERN)

    def test_new_dealer_gets_random_slug(self):
        account = Account.objects.create_user(
            username="dealer_code",
            email="dealer_code@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        dealer = DealerProfile.objects.create(
            account=account,
            store_name="Cửa hàng Rau Sạch ABC",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.assertRegex(dealer.slug, STORE_CODE_PATTERN)
        self.assertNotIn("cua-hang", dealer.slug)
        self.assertNotIn("rau", dealer.slug)

    def test_store_name_change_does_not_change_slug(self):
        account = Account.objects.create_user(
            username="dealer_code2",
            email="dealer_code2@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        dealer = DealerProfile.objects.create(
            account=account,
            store_name="Tên cũ",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        original = dealer.slug
        dealer.store_name = "Tên mới hoàn toàn khác"
        dealer.save()
        dealer.refresh_from_db()
        self.assertEqual(dealer.slug, original)

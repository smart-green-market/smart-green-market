"""Tests for loyalty points and tier logic."""

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.customers.models import CustomerProfile
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.loyalty.models import (
    LoyaltyPointTransaction,
    LoyaltyPointTransactionType,
    LoyaltyTier,
)
from apps.loyalty.services import (
    award_points_for_completed_order,
    build_loyalty_status,
    deduct_points_for_approved_return,
    resolve_tier_for_points,
)
from apps.loyalty.tier_defaults import seed_default_loyalty_for_dealer
from apps.orders.models import Order, OrderStatus


class LoyaltyServiceTests(TestCase):
    def setUp(self):
        dealer_account = Account.objects.create_user(
            username="dealer_loyalty",
            email="dealer_loyalty@test.com",
            password="pass12345",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer = DealerProfile.objects.create(
            account=dealer_account,
            store_name="Green Farm",
            status=DealerProfileStatus.ACTIVE,
        )
        seed_default_loyalty_for_dealer(self.dealer)

        buyer_account = Account.objects.create_user(
            username="buyer_loyalty",
            email="buyer@test.com",
            password="pass12345",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
            store_dealer=self.dealer,
        )
        self.customer = CustomerProfile.objects.create(user=buyer_account)

        self.order = Order.objects.create(
            order_code="DH-LOYALTY-001",
            customer=self.customer,
            dealer=self.dealer,
            status=OrderStatus.COMPLETED,
            receiver_name="Buyer",
            receiver_phone="0900000000",
            delivery_address="123 Test Street",
            delivery_time=timezone.now(),
            subtotal_amount=Decimal("350000.00"),
            discount_amount=Decimal("0.00"),
            shipping_fee=Decimal("10000.00"),
            total_amount=Decimal("360000.00"),
        )

    def test_award_points_on_completed_order(self):
        tx = award_points_for_completed_order(self.order, actor=self.dealer.account)
        self.assertIsNotNone(tx)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.loyalty_points, 35)
        self.assertEqual(tx.transaction_type, LoyaltyPointTransactionType.ORDER_REWARD)

    def test_award_points_is_idempotent(self):
        award_points_for_completed_order(self.order, actor=self.dealer.account)
        award_points_for_completed_order(self.order, actor=self.dealer.account)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.loyalty_points, 35)
        self.assertEqual(
            LoyaltyPointTransaction.objects.filter(
                order=self.order,
                transaction_type=LoyaltyPointTransactionType.ORDER_REWARD,
            ).count(),
            1,
        )

    def test_tier_upgrade_after_points(self):
        self.customer.loyalty_points = 980
        self.customer.current_tier = resolve_tier_for_points(self.dealer, 980)
        self.customer.save(update_fields=["loyalty_points", "current_tier", "updated_at"])

        award_points_for_completed_order(self.order, actor=self.dealer.account)
        self.customer.refresh_from_db()

        gold = LoyaltyTier.objects.get(dealer=self.dealer, code="GOLD")
        self.assertEqual(self.customer.current_tier_id, gold.id)
        self.assertEqual(self.customer.loyalty_points, 1015)

    def test_deduct_points_on_return(self):
        award_points_for_completed_order(self.order, actor=self.dealer.account)
        tx = deduct_points_for_approved_return(self.order, actor=self.dealer.account)
        self.assertIsNotNone(tx)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.loyalty_points, 0)

    def test_build_loyalty_status_has_next_tier(self):
        self.customer.loyalty_points = 1250
        self.customer.current_tier = resolve_tier_for_points(self.dealer, 1250)
        self.customer.save(update_fields=["loyalty_points", "current_tier", "updated_at"])

        status = build_loyalty_status(self.customer)
        self.assertEqual(status["loyalty_points"], 1250)
        self.assertEqual(status["current_tier"].code, "GOLD")
        self.assertEqual(status["next_tier"].code, "DIAMOND")
        self.assertEqual(status["remaining_points"], 750)

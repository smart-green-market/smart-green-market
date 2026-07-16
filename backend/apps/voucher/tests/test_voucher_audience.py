"""Tests voucher audience: ALL, LOYALTY_TIER, CUSTOMER_SEGMENT."""

from datetime import datetime, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryScope, CategoryStatus
from apps.customers.models import CustomerAddress, CustomerProfile
from apps.dealer_products.canonical_inventory import CANONICAL_BATCH_NUMBER
from apps.dealer_products.models import (
    DealerInventoryBatch,
    DealerInventoryBatchStatus,
    DealerProduct,
    DealerProductStatus,
)
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.loyalty.models import LoyaltyTier
from apps.loyalty.tier_defaults import seed_default_loyalty_for_dealer
from apps.marketing.models import CustomerSegment, CustomerSegmentMember
from apps.orders.services import create_customer_order
from apps.orders.delivery_slots import get_available_delivery_slots
from apps.promotions.models import (
    CustomerSavedVoucher,
    Promotion,
    PromotionDiscountType,
    PromotionStatus,
    PromotionTarget,
    PromotionTargetType,
    VoucherAudienceType,
)
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from apps.voucher.audience_service import (
    customer_matches_voucher_audience,
    filter_promotions_matching_audience,
)
from apps.voucher.audience_sync import sync_promotion_audience
from apps.voucher.serializers import AvailablePromotionSerializer, PromotionSerializer
from apps.voucher.services import CartVoucherService
from apps.voucher.views import PromotionViewSet


class VoucherAudienceTestBase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.dealer_account = Account.objects.create_user(
            username="dealer_audience",
            email="dealer_audience@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.other_dealer_account = Account.objects.create_user(
            username="dealer_audience_other",
            email="dealer_audience_other@test.com",
            password="pass",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        supplier_account = Account.objects.create_user(
            username="supplier_audience",
            email="supplier_audience@test.com",
            password="pass",
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE,
        )
        self.buyer_account = Account.objects.create_user(
            username="buyer_audience",
            email="buyer_audience@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )
        self.other_buyer_account = Account.objects.create_user(
            username="buyer_audience_other",
            email="buyer_audience_other@test.com",
            password="pass",
            role=AccountRole.BUYER,
            status=AccountStatus.ACTIVE,
        )

        self.dealer = DealerProfile.objects.create(
            account=self.dealer_account,
            store_name="Audience Store",
            store_address="Addr",
            status=DealerProfileStatus.ACTIVE,
        )
        self.other_dealer = DealerProfile.objects.create(
            account=self.other_dealer_account,
            store_name="Other Store",
            store_address="Addr2",
            status=DealerProfileStatus.ACTIVE,
        )
        seed_default_loyalty_for_dealer(self.dealer)
        seed_default_loyalty_for_dealer(self.other_dealer)

        self.buyer_account.store_dealer = self.dealer
        self.buyer_account.save(update_fields=["store_dealer"])
        self.other_buyer_account.store_dealer = self.other_dealer
        self.other_buyer_account.save(update_fields=["store_dealer"])

        self.customer = CustomerProfile.objects.create(user=self.buyer_account)
        self.other_customer = CustomerProfile.objects.create(user=self.other_buyer_account)
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            receiver_name="Buyer",
            receiver_phone="0900000000",
            address="HN",
            is_default=True,
        )

        supplier = Supplier.objects.create(
            account=supplier_account,
            company_name="NCC Audience",
            tax_code="0123456789",
            phone="0900000001",
            address="HN",
            verification_status=SupplierVerificationStatus.APPROVED,
        )
        self.category = Category.objects.create(
            name="Rau",
            scope=CategoryScope.SYSTEM,
            status=CategoryStatus.ACTIVE,
        )
        supplier_product = SupplierProduct.objects.create(
            supplier=supplier,
            category=self.category,
            name="Cai",
            slug="cai-audience",
            unit="kg",
            wholesale_price="10000.00",
            storage_duration_days=10,
            status=SupplierProductStatus.ACTIVE,
        )
        self.product = DealerProduct.objects.create(
            dealer_profile=self.dealer,
            supplier_product=supplier_product,
            category=self.category,
            title="Cai ban le",
            retail_price=Decimal("50000.00"),
            status=DealerProductStatus.ACTIVE,
        )
        today = timezone.localdate()
        DealerInventoryBatch.objects.create(
            dealer_product=self.product,
            batch_number=CANONICAL_BATCH_NUMBER,
            quantity=20,
            remaining_quantity=20,
            import_price="10000.00",
            import_date=today,
            expiry_date=today + timedelta(days=10),
            status=DealerInventoryBatchStatus.ACTIVE,
        )

        self.gold_tier = LoyaltyTier.objects.get(dealer=self.dealer, code="GOLD")
        self.silver_tier = LoyaltyTier.objects.get(dealer=self.dealer, code="SILVER")
        self.other_gold = LoyaltyTier.objects.get(dealer=self.other_dealer, code="GOLD")

        self.passive_segment = CustomerSegment.objects.create(
            code="PASSIVE_AUD",
            name="Khách thụ động",
        )
        self.churn_segment = CustomerSegment.objects.create(
            code="CHURN_AUD",
            name="Nguy cơ rời bỏ",
        )

    def _promotion_defaults(self, **overrides):
        data = {
            "dealer": self.dealer,
            "created_by": self.dealer_account,
            "title": "Test voucher",
            "code": overrides.pop("code", "TESTVOUCH"),
            "discount_type": PromotionDiscountType.PERCENT,
            "discount_value": Decimal("10"),
            "min_order_amount": Decimal("0"),
            "start_date": timezone.now() - timedelta(hours=1),
            "end_date": timezone.now() + timedelta(days=1),
            "status": PromotionStatus.ACTIVE,
        }
        data.update(overrides)
        return data

    def _create_promotion(self, **overrides):
        return Promotion.objects.create(**self._promotion_defaults(**overrides))

    def _save_voucher(self, customer, promotion):
        CustomerSavedVoucher.objects.create(customer=customer, promotion=promotion)

    def _apply_items(self, customer, code):
        return CartVoucherService.apply_voucher(
            customer,
            code,
            [{"dealer_product_id": self.product.id, "quantity": 1}],
        )

    def _serializer_context(self, user):
        request = self.factory.post("/api/vouchers/")
        force_authenticate(request, user=user)
        if not hasattr(request, "user"):
            request.user = user
        return {"request": request}


class AllAudienceTests(VoucherAudienceTestBase):
    def test_all_customer_same_dealer_can_use(self):
        promo = self._create_promotion(
            code="ALLDEALER",
            audience_type=VoucherAudienceType.ALL,
        )
        self._save_voucher(self.customer, promo)
        result = self._apply_items(self.customer, "ALLDEALER")
        self.assertEqual(result["discount_amount"], 5000)

    def test_all_customer_other_dealer_cannot_use(self):
        promo = self._create_promotion(
            code="ALLBLOCK",
            audience_type=VoucherAudienceType.ALL,
        )
        self._save_voucher(self.other_customer, promo)
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.other_customer, "ALLBLOCK")
        self.assertIn(
            "Mã giảm giá không thuộc cửa hàng này.",
            ctx.exception.detail["voucher_code"],
        )

    def test_all_no_tier_or_segment_required(self):
        promo = self._create_promotion(
            code="ALLFREE",
            audience_type=VoucherAudienceType.ALL,
        )
        self.assertTrue(customer_matches_voucher_audience(promo, self.customer))


class LoyaltyTierAudienceTests(VoucherAudienceTestBase):
    def setUp(self):
        super().setUp()
        self.customer.current_tier = self.gold_tier
        self.customer.save(update_fields=["current_tier", "updated_at"])

    def _tier_promo(self, code="GOLDONLY", tiers=None):
        promo = self._create_promotion(code=code, audience_type=VoucherAudienceType.LOYALTY_TIER)
        promo.loyalty_tiers.set(tiers or [self.gold_tier])
        return promo

    def test_correct_tier_can_use(self):
        promo = self._tier_promo()
        self._save_voucher(self.customer, promo)
        self._apply_items(self.customer, "GOLDONLY")

    def test_wrong_tier_rejected(self):
        promo = self._tier_promo(code="SILONLY", tiers=[self.silver_tier])
        self._save_voucher(self.customer, promo)
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.customer, "SILONLY")
        self.assertIn(
            "Hạng thành viên hiện tại không đủ điều kiện sử dụng mã giảm giá này.",
            ctx.exception.detail["voucher_code"],
        )

    def test_no_tier_rejected(self):
        self.customer.current_tier = None
        self.customer.save(update_fields=["current_tier", "updated_at"])
        promo = self._tier_promo()
        self._save_voucher(self.customer, promo)
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.customer, "GOLDONLY")
        self.assertIn(
            "Hạng thành viên hiện tại không đủ điều kiện sử dụng mã giảm giá này.",
            ctx.exception.detail["voucher_code"],
        )

    def test_cannot_select_other_dealer_tier_on_create(self):
        serializer = PromotionSerializer(
            data={
                "title": "Tier cross dealer",
                "code": "CROSSDEALER",
                "description": "",
                "discount_type": "percent",
                "discount_value": "10",
                "min_order_amount": "0",
                "start_date": timezone.now().isoformat(),
                "end_date": (timezone.now() + timedelta(days=1)).isoformat(),
                "audience_type": VoucherAudienceType.LOYALTY_TIER,
                "loyalty_tier_ids": [self.other_gold.id],
            },
            context=self._serializer_context(self.dealer_account),
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("loyalty_tier_ids", serializer.errors)

    def test_multiple_tiers(self):
        promo = self._tier_promo(code="MULTITIER", tiers=[self.gold_tier, self.silver_tier])
        self._save_voucher(self.customer, promo)
        self._apply_items(self.customer, "MULTITIER")

    def test_tier_downgrade_before_checkout_rejected(self):
        promo = self._tier_promo()
        self._save_voucher(self.customer, promo)
        self.customer.current_tier = self.silver_tier
        self.customer.save(update_fields=["current_tier", "updated_at"])
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.customer, "GOLDONLY")
        self.assertIn(
            "Hạng thành viên hiện tại không đủ điều kiện sử dụng mã giảm giá này.",
            ctx.exception.detail["voucher_code"],
        )


class CustomerSegmentAudienceTests(VoucherAudienceTestBase):
    def _segment_promo(self, code="SEGMENT1", segments=None):
        promo = self._create_promotion(
            code=code,
            audience_type=VoucherAudienceType.CUSTOMER_SEGMENT,
        )
        for segment in segments or [self.passive_segment]:
            PromotionTarget.objects.create(
                promotion=promo,
                target_type=PromotionTargetType.SEGMENT,
                segment=segment,
            )
        return promo

    def test_matching_segment_can_use(self):
        CustomerSegmentMember.objects.create(
            customer_profile=self.customer,
            segment=self.passive_segment,
        )
        promo = self._segment_promo()
        self._save_voucher(self.customer, promo)
        self._apply_items(self.customer, "SEGMENT1")

    def test_wrong_segment_rejected_without_leaking_name(self):
        promo = self._segment_promo()
        self._save_voucher(self.customer, promo)
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.customer, "SEGMENT1")
        message = " ".join(str(x) for x in ctx.exception.detail["voucher_code"])
        self.assertIn("Mã giảm giá này không áp dụng cho tài khoản của bạn.", message)
        self.assertNotIn("PASSIVE", message)
        self.assertNotIn("CHURN", message)

    def test_available_list_hides_segment_info(self):
        CustomerSegmentMember.objects.create(
            customer_profile=self.customer,
            segment=self.passive_segment,
        )
        self._segment_promo(code="AVAILSEG")
        viewset = PromotionViewSet()
        qs = viewset._available_promotions_for_customer(self.customer, self.dealer)
        self.assertTrue(qs.filter(code="AVAILSEG").exists())

        data = AvailablePromotionSerializer(
            qs.filter(code="AVAILSEG").first(),
            context={"saved_promotion_ids": set()},
        ).data
        self.assertNotIn("customer_segments", data)
        self.assertNotIn("audience_type", data)
        self.assertNotIn("PASSIVE", str(data))


class UpdateAudienceTests(VoucherAudienceTestBase):
    def test_segment_to_all_removes_segment_targets(self):
        promo = self._create_promotion(
            code="SEG2ALL",
            audience_type=VoucherAudienceType.CUSTOMER_SEGMENT,
        )
        PromotionTarget.objects.create(
            promotion=promo,
            target_type=PromotionTargetType.SEGMENT,
            segment=self.passive_segment,
        )
        PromotionTarget.objects.create(
            promotion=promo,
            target_type=PromotionTargetType.PRODUCT,
            dealer_product=self.product,
        )
        sync_promotion_audience(
            promo,
            audience_type=VoucherAudienceType.ALL,
            loyalty_tier_ids=[],
            customer_segment_ids=[],
        )
        self.assertFalse(
            promo.targets.filter(target_type=PromotionTargetType.SEGMENT).exists()
        )
        self.assertTrue(
            promo.targets.filter(target_type=PromotionTargetType.PRODUCT).exists()
        )

    def test_tier_to_all_clears_tiers(self):
        promo = self._create_promotion(
            code="TIER2ALL",
            audience_type=VoucherAudienceType.LOYALTY_TIER,
        )
        promo.loyalty_tiers.set([self.gold_tier])
        sync_promotion_audience(
            promo,
            audience_type=VoucherAudienceType.ALL,
            loyalty_tier_ids=[],
            customer_segment_ids=[],
        )
        self.assertEqual(promo.loyalty_tiers.count(), 0)

    def test_segment_to_tier_removes_segments(self):
        promo = self._create_promotion(
            code="SEG2TIER",
            audience_type=VoucherAudienceType.CUSTOMER_SEGMENT,
        )
        PromotionTarget.objects.create(
            promotion=promo,
            target_type=PromotionTargetType.SEGMENT,
            segment=self.passive_segment,
        )
        sync_promotion_audience(
            promo,
            audience_type=VoucherAudienceType.LOYALTY_TIER,
            loyalty_tier_ids=[self.gold_tier.id],
            customer_segment_ids=[],
        )
        self.assertFalse(
            promo.targets.filter(target_type=PromotionTargetType.SEGMENT).exists()
        )
        self.assertTrue(promo.loyalty_tiers.filter(id=self.gold_tier.id).exists())

    def test_tier_to_segment_clears_tiers(self):
        promo = self._create_promotion(
            code="TIER2SEG",
            audience_type=VoucherAudienceType.LOYALTY_TIER,
        )
        promo.loyalty_tiers.set([self.gold_tier])
        sync_promotion_audience(
            promo,
            audience_type=VoucherAudienceType.CUSTOMER_SEGMENT,
            loyalty_tier_ids=[],
            customer_segment_ids=[self.passive_segment.id],
        )
        self.assertEqual(promo.loyalty_tiers.count(), 0)
        self.assertTrue(
            promo.targets.filter(
                target_type=PromotionTargetType.SEGMENT,
                segment=self.passive_segment,
            ).exists()
        )

    def test_update_audience_preserves_product_targets_via_serializer(self):
        promo = self._create_promotion(
            code="KEEPPROD",
            audience_type=VoucherAudienceType.CUSTOMER_SEGMENT,
        )
        PromotionTarget.objects.create(
            promotion=promo,
            target_type=PromotionTargetType.SEGMENT,
            segment=self.passive_segment,
        )
        PromotionTarget.objects.create(
            promotion=promo,
            target_type=PromotionTargetType.CATEGORY,
            category=self.category,
        )
        serializer = PromotionSerializer(
            promo,
            data={"audience_type": VoucherAudienceType.ALL},
            partial=True,
            context=self._serializer_context(self.dealer_account),
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        promo.refresh_from_db()
        self.assertEqual(promo.audience_type, VoucherAudienceType.ALL)
        self.assertFalse(
            promo.targets.filter(target_type=PromotionTargetType.SEGMENT).exists()
        )
        self.assertTrue(
            promo.targets.filter(target_type=PromotionTargetType.CATEGORY).exists()
        )


class CheckoutAudienceTests(VoucherAudienceTestBase):
    def test_checkout_revalidates_tier(self):
        self.customer.current_tier = self.gold_tier
        self.customer.save(update_fields=["current_tier", "updated_at"])
        promo = self._create_promotion(
            code="CHKOUTTIER",
            audience_type=VoucherAudienceType.LOYALTY_TIER,
        )
        promo.loyalty_tiers.set([self.gold_tier])
        self._save_voucher(self.customer, promo)

        self.customer.current_tier = self.silver_tier
        self.customer.save(update_fields=["current_tier", "updated_at"])

        delivery_time = next(
            datetime.fromisoformat(slot["delivery_time"])
            for day in get_available_delivery_slots()["dates"]
            for slot in day["slots"]
            if slot["available"]
        )

        with self.assertRaises(ValidationError):
            create_customer_order(
                dealer=self.dealer,
                customer=self.customer,
                customer_address_id=self.address.id,
                delivery_time=delivery_time,
                note="",
                items_data=[{"dealer_product": self.product, "quantity": 1}],
                user=self.customer.user,
                voucher_code="CHKOUTTIER",
            )

    def test_expired_voucher_rejected_at_checkout(self):
        promo = self._create_promotion(
            code="EXPIRED1",
            audience_type=VoucherAudienceType.ALL,
            end_date=timezone.now() - timedelta(hours=1),
        )
        self._save_voucher(self.customer, promo)
        delivery_time = next(
            datetime.fromisoformat(slot["delivery_time"])
            for day in get_available_delivery_slots()["dates"]
            for slot in day["slots"]
            if slot["available"]
        )
        with self.assertRaises(ValidationError):
            create_customer_order(
                dealer=self.dealer,
                customer=self.customer,
                customer_address_id=self.address.id,
                delivery_time=delivery_time,
                note="",
                items_data=[{"dealer_product": self.product, "quantity": 1}],
                user=self.customer.user,
                voucher_code="EXPIRED1",
            )

    def test_inactive_voucher_rejected(self):
        promo = self._create_promotion(
            code="INACTIVE1",
            audience_type=VoucherAudienceType.ALL,
            status=PromotionStatus.INACTIVE,
        )
        self._save_voucher(self.customer, promo)
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.customer, "INACTIVE1")
        self.assertIn("Voucher đã bị xóa hoặc tạm dừng.", ctx.exception.detail["voucher_code"])

    def test_usage_limit_rejected(self):
        promo = self._create_promotion(
            code="LIMIT1",
            audience_type=VoucherAudienceType.ALL,
            usage_limit=0,
        )
        self._save_voucher(self.customer, promo)
        with self.assertRaises(ValidationError) as ctx:
            self._apply_items(self.customer, "LIMIT1")
        self.assertIn("Voucher đã đạt giới hạn sử dụng.", ctx.exception.detail["voucher_code"])


class FilterAudienceTests(VoucherAudienceTestBase):
    def test_filter_promotions_matching_audience(self):
        self._create_promotion(code="FALL", audience_type=VoucherAudienceType.ALL)
        tier_promo = self._create_promotion(
            code="FTIER",
            audience_type=VoucherAudienceType.LOYALTY_TIER,
        )
        tier_promo.loyalty_tiers.set([self.gold_tier])
        self.customer.current_tier = self.gold_tier
        self.customer.save(update_fields=["current_tier", "updated_at"])

        qs = Promotion.objects.filter(code__in=["FALL", "FTIER"])
        matched = filter_promotions_matching_audience(qs, self.customer)
        codes = set(matched.values_list("code", flat=True))
        self.assertEqual(codes, {"FALL", "FTIER"})

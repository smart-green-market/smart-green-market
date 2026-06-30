from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIRequestFactory
from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.dealers.models import DealerProfile
from apps.promotions.models import Promotion, PromotionStatus, PromotionDiscountType
from apps.voucher.views import PromotionViewSet
from apps.voucher.serializers import PromotionSerializer


class VoucherAPITests(TestCase):
    def setUp(self):
        # Create users
        self.admin = Account.objects.create_user(
            username="admin_user",
            email="admin@test.com",
            password="password123",
            role=AccountRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )

        self.dealer_user = Account.objects.create_user(
            username="dealer_user",
            email="dealer@test.com",
            password="password123",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.dealer_profile = DealerProfile.objects.create(
            account=self.dealer_user,
            store_name="Dealer Store",
        )

        self.other_dealer_user = Account.objects.create_user(
            username="other_dealer_user",
            email="other@test.com",
            password="password123",
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE,
        )
        self.other_dealer_profile = DealerProfile.objects.create(
            account=self.other_dealer_user,
            store_name="Other Store",
        )

        # Create promotions
        self.promo_dealer = Promotion.objects.create(
            dealer=self.dealer_profile,
            created_by=self.dealer_user,
            title="Dealer Promo",
            code="DEALER10",
            discount_type=PromotionDiscountType.PERCENT,
            discount_value=10,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            status=PromotionStatus.ACTIVE,
        )

        self.promo_other = Promotion.objects.create(
            dealer=self.other_dealer_profile,
            created_by=self.other_dealer_user,
            title="Other Dealer Promo",
            code="OTHER10",
            discount_type=PromotionDiscountType.PERCENT,
            discount_value=10,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            status=PromotionStatus.ACTIVE,
        )

        self.promo_platform = Promotion.objects.create(
            dealer=None,
            created_by=self.admin,
            title="Platform Promo",
            code="PLATFORM20",
            discount_type=PromotionDiscountType.FIXED,
            discount_value=20,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            status=PromotionStatus.ACTIVE,
        )

        self.factory = APIRequestFactory()

    def test_dealer_can_only_see_own_promotions(self):
        request = self.factory.get("/api/vouchers/")
        request.user = self.dealer_user
        view = PromotionViewSet()
        view.request = request
        view.action = "list"

        qs = view.get_queryset()
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first(), self.promo_dealer)

    def test_admin_can_see_all_promotions(self):
        request = self.factory.get("/api/vouchers/")
        request.user = self.admin
        view = PromotionViewSet()
        view.request = request
        view.action = "list"

        qs = view.get_queryset()
        self.assertEqual(qs.count(), 3)

    def test_serializer_validates_dates(self):
        now = timezone.now()
        data = {
            "title": "Invalid Dates Promo",
            "code": "INVALID",
            "discount_type": "percent",
            "discount_value": 10,
            "start_date": now,
            "end_date": now - timedelta(hours=1),
            "status": "draft",
        }
        serializer = PromotionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertEqual(
            serializer.errors["non_field_errors"][0], "start_date phải trước end_date"
        )

    def test_available_promotions_denied_for_dealer(self):
        from rest_framework.test import force_authenticate
        from apps.voucher.views import AvailablePromotionsView
        request = self.factory.get("/api/vouchers/available/")
        force_authenticate(request, user=self.dealer_user)
        view = AvailablePromotionsView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 403)


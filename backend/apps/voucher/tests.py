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
        from apps.voucher.views import PromotionViewSet
        request = self.factory.get("/api/vouchers/available/")
        force_authenticate(request, user=self.dealer_user)
        view = PromotionViewSet.as_view({"get": "available"})
        response = view(request)
        self.assertEqual(response.status_code, 403)

    def test_soft_delete(self):
        from apps.promotions.models import PromotionStatus
        from rest_framework.test import force_authenticate
        request = self.factory.delete(f"/api/vouchers/{self.promo_dealer.id}/")
        force_authenticate(request, user=self.dealer_user)
        view = PromotionViewSet.as_view({"delete": "destroy"})
        response = view(request, pk=self.promo_dealer.id)
        self.assertEqual(response.status_code, 204)

        # Kiểm tra xem bản ghi vẫn tồn tại trong DB nhưng có status = inactive
        self.promo_dealer.refresh_from_db()
        self.assertEqual(self.promo_dealer.status, PromotionStatus.INACTIVE)

    def test_verify_approve_success(self):
        from rest_framework.test import force_authenticate
        from apps.promotions.models import PromotionStatus
        self.promo_dealer.status = PromotionStatus.PENDING
        self.promo_dealer.save()

        request = self.factory.post(
            f"/api/vouchers/{self.promo_dealer.id}/verify/",
            {"status": "active"}
        )
        force_authenticate(request, user=self.admin)
        view = PromotionViewSet.as_view({"post": "verify"})
        response = view(request, pk=self.promo_dealer.id)
        self.assertEqual(response.status_code, 200)

        self.promo_dealer.refresh_from_db()
        self.assertEqual(self.promo_dealer.status, PromotionStatus.ACTIVE)
        self.assertIsNone(self.promo_dealer.reject_reason)

    def test_verify_reject_success(self):
        from rest_framework.test import force_authenticate
        from apps.promotions.models import PromotionStatus
        request = self.factory.post(
            f"/api/vouchers/{self.promo_dealer.id}/verify/",
            {"status": "rejected", "reject_reason": "Voucher không phù hợp chính sách."}
        )
        force_authenticate(request, user=self.admin)
        view = PromotionViewSet.as_view({"post": "verify"})
        response = view(request, pk=self.promo_dealer.id)
        self.assertEqual(response.status_code, 200)

        self.promo_dealer.refresh_from_db()
        self.assertEqual(self.promo_dealer.status, PromotionStatus.REJECTED)
        self.assertEqual(self.promo_dealer.reject_reason, "Voucher không phù hợp chính sách.")

    def test_verify_reject_without_reason_fails(self):
        from rest_framework.test import force_authenticate
        request = self.factory.post(
            f"/api/vouchers/{self.promo_dealer.id}/verify/",
            {"status": "rejected"}
        )
        force_authenticate(request, user=self.admin)
        view = PromotionViewSet.as_view({"post": "verify"})
        response = view(request, pk=self.promo_dealer.id)
        self.assertEqual(response.status_code, 400)
        self.assertIn("reject_reason", response.data.get("errors", response.data))

    def test_verify_denied_for_dealer(self):
        from rest_framework.test import force_authenticate
        request = self.factory.post(
            f"/api/vouchers/{self.promo_dealer.id}/verify/",
            {"status": "active"}
        )
        force_authenticate(request, user=self.dealer_user)
        view = PromotionViewSet.as_view({"post": "verify"})
        response = view(request, pk=self.promo_dealer.id)
        self.assertEqual(response.status_code, 403)


class CartApplyVoucherTests(TestCase):
    def setUp(self):
        from apps.accounts.models import Account, AccountRole, AccountStatus
        from apps.dealers.models import DealerProfile
        from apps.categories.models import Category
        from apps.suppliers.models import Supplier
        from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
        from apps.dealer_products.models import DealerProduct
        from apps.customers.models import CustomerProfile
        from apps.promotions.models import Promotion, PromotionStatus, PromotionDiscountType
        from rest_framework.test import APIRequestFactory
        from decimal import Decimal

        self.factory = APIRequestFactory()

        # Create admin
        self.admin = Account.objects.create_user(
            username="admin_user", email="admin@test.com", password="password123",
            role=AccountRole.ADMIN, status=AccountStatus.ACTIVE
        )

        # Create dealer
        self.dealer_user = Account.objects.create_user(
            username="dealer_user", email="dealer@test.com", password="password123",
            role=AccountRole.DEALER, status=AccountStatus.ACTIVE
        )
        self.dealer_profile = DealerProfile.objects.create(
            account=self.dealer_user, store_name="Dealer Store"
        )

        # Create buyer and customer profile
        self.buyer_user = Account.objects.create_user(
            username="buyer_user", email="buyer@test.com", password="password123",
            role=AccountRole.BUYER, status=AccountStatus.ACTIVE,
            store_dealer=self.dealer_profile
        )
        self.customer_profile = CustomerProfile.objects.create(
            user=self.buyer_user
        )

        # Create category, supplier and product
        self.category = Category.objects.create(name="Rau Củ")
        
        self.supplier_user = Account.objects.create_user(
            username="supplier_user", email="supplier@test.com", password="password123",
            role=AccountRole.SUPPLIER, status=AccountStatus.ACTIVE
        )
        self.supplier = Supplier.objects.create(
            account=self.supplier_user,
            company_name="Supplier Company",
            tax_code="123456789",
            phone="0123456789",
            address="123 Supplier Rd",
        )

        self.supplier_product = SupplierProduct.objects.create(
            supplier=self.supplier,
            category=self.category,
            name="Rau Củ Quả",
            slug="rau-cu-qua",
            unit="kg",
            wholesale_price=Decimal("10000.00"),
            status=SupplierProductStatus.ACTIVE,
        )

        self.dealer_product = DealerProduct.objects.create(
            dealer_profile=self.dealer_profile,
            supplier_product=self.supplier_product,
            category=self.category,
            retail_price=Decimal("150000.00"),
            title="Rau Củ Tươi Ngon",
            status="active",
        )

        # Create active Promotion
        self.promo = Promotion.objects.create(
            dealer=self.dealer_profile,
            created_by=self.dealer_user,
            title="Giảm 10 phần trăm",
            code="SALE10PERCENT",
            discount_type=PromotionDiscountType.PERCENT,
            discount_value=10,
            start_date=timezone.now() - timedelta(hours=1),
            end_date=timezone.now() + timedelta(days=5),
            status=PromotionStatus.ACTIVE,
        )

    def test_apply_cart_voucher_success(self):
        from rest_framework.test import force_authenticate
        from apps.voucher.views import CartApplyVoucherView
        
        request = self.factory.post(
            "/api/cart/apply-voucher/",
            {
                "voucher_code": "SALE10PERCENT",
                "items": [
                    {
                        "dealer_product_id": self.dealer_product.id,
                        "quantity": 3
                    }
                ]
            },
            format="json"
        )
        force_authenticate(request, user=self.buyer_user)
        view = CartApplyVoucherView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["eligible_total"], "450000.00")
        self.assertEqual(response.data["order_total"], "450000.00")
        self.assertEqual(response.data["discount_amount"], "45000.00")
        self.assertEqual(response.data["final_total"], "405000.00")

    def test_apply_cart_voucher_not_found(self):
        from rest_framework.test import force_authenticate
        from apps.voucher.views import CartApplyVoucherView
        
        request = self.factory.post(
            "/api/cart/apply-voucher/",
            {
                "voucher_code": "NONEXISTENT",
                "items": [
                    {
                        "dealer_product_id": self.dealer_product.id,
                        "quantity": 1
                    }
                ]
            },
            format="json"
        )
        force_authenticate(request, user=self.buyer_user)
        view = CartApplyVoucherView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 400)

    def test_apply_cart_voucher_expired(self):
        from rest_framework.test import force_authenticate
        from apps.voucher.views import CartApplyVoucherView
        from apps.promotions.models import Promotion, PromotionDiscountType, PromotionStatus
        
        expired_promo = Promotion.objects.create(
            dealer=self.dealer_profile,
            created_by=self.dealer_user,
            title="Expired Promo",
            code="EXPIRED",
            discount_type=PromotionDiscountType.PERCENT,
            discount_value=10,
            start_date=timezone.now() - timedelta(days=5),
            end_date=timezone.now() - timedelta(days=1),
            status=PromotionStatus.ACTIVE,
        )

        request = self.factory.post(
            "/api/cart/apply-voucher/",
            {
                "voucher_code": "EXPIRED",
                "items": [
                    {
                        "dealer_product_id": self.dealer_product.id,
                        "quantity": 1
                    }
                ]
            },
            format="json"
        )
        force_authenticate(request, user=self.buyer_user)
        view = CartApplyVoucherView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 400)

    def test_apply_cart_voucher_min_order_failed(self):
        from rest_framework.test import force_authenticate
        from apps.voucher.views import CartApplyVoucherView
        from apps.promotions.models import Promotion, PromotionDiscountType, PromotionStatus
        
        min_promo = Promotion.objects.create(
            dealer=self.dealer_profile,
            created_by=self.dealer_user,
            title="Min Order Promo",
            code="MIN500K",
            discount_type=PromotionDiscountType.PERCENT,
            discount_value=10,
            min_order_amount=500000.00,
            start_date=timezone.now() - timedelta(hours=1),
            end_date=timezone.now() + timedelta(days=5),
            status=PromotionStatus.ACTIVE,
        )

        request = self.factory.post(
            "/api/cart/apply-voucher/",
            {
                "voucher_code": "MIN500K",
                "items": [
                    {
                        "dealer_product_id": self.dealer_product.id,
                        "quantity": 2 # 300000.00 total
                    }
                ]
            },
            format="json"
        )
        force_authenticate(request, user=self.buyer_user)
        view = CartApplyVoucherView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 400)

    def test_voucher_code_validation_and_uniqueness(self):
        # 1. Test invalid code (contains spaces)
        serializer = PromotionSerializer(data={
            "title": "Invalid Code Space",
            "code": "SALE 50K",
            "discount_type": "percent",
            "discount_value": 10,
            "start_date": timezone.now(),
            "end_date": timezone.now() + timedelta(days=5),
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("code", serializer.errors)

        # 2. Test invalid code (contains accents/diacritics)
        serializer2 = PromotionSerializer(data={
            "title": "Invalid Code Diacritic",
            "code": "KHUYẾNMÃI",
            "discount_type": "percent",
            "discount_value": 10,
            "start_date": timezone.now(),
            "end_date": timezone.now() + timedelta(days=5),
        })
        self.assertFalse(serializer2.is_valid())
        self.assertIn("code", serializer2.errors)

        # 3. Test lowercase auto upper-case normalization
        serializer3 = PromotionSerializer(data={
            "title": "Lowercase Promo",
            "code": "sale-100k",
            "discount_type": "percent",
            "discount_value": 10,
            "start_date": timezone.now(),
            "end_date": timezone.now() + timedelta(days=5),
        })
        self.assertTrue(serializer3.is_valid())
        promo = serializer3.save(dealer=self.dealer_profile, created_by=self.dealer_user)
        self.assertEqual(promo.code, "SALE-100K") # Normalized to uppercase

        # 4. Test uniqueness constraint
        serializer4 = PromotionSerializer(data={
            "title": "Duplicate Promo",
            "code": "SALE-100K", # same code
            "discount_type": "percent",
            "discount_value": 10,
            "start_date": timezone.now(),
            "end_date": timezone.now() + timedelta(days=5),
        })
        self.assertFalse(serializer4.is_valid())



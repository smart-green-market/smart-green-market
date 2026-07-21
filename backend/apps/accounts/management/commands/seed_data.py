import random
import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker

from apps.accounts.models import Account, AccountRole, AccountStatus
from apps.categories.models import Category, CategoryStatus, CategoryScope
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.customers.models import CustomerProfile, CustomerAddress
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.dealer_products.models import DealerInventoryBatch
from apps.orders.models import Order
from apps.product_catalog.models import ProductMaster

from .seed_customer_journeys import seed_customer_journeys
from .seed_product_reviews import seed_product_reviews
from .seed_purchase_orders import seed_purchase_orders_and_payments
from .seed_dealer_customer_tiers import (
    DEALER_BUYER_COUNTS,
    BuyerSeedSpec,
    resolve_buyer_tier,
)
from .seed_deterministic import (
    SEED_DEALER_SLUGS,
    SEED_DEALER_STORE_NAMES,
    SEED_FAKER_SEED,
    SEED_RANDOM_SEED,
    SEED_SUPPLIER_COMPANIES,
    seed_buyer_email,
    seed_buyer_full_name,
    seed_phone,
)
from .seed_product_helpers import (
    DEALER_CUSTOM_CATEGORY_LABELS,
    SEED_CATEGORY_NAMES,
    SEED_PRODUCT_MASTERS,
    build_dealer_description,
    build_supplier_description,
    create_cultivation_processes,
    create_dealer_inventory_batches,
    get_storage_profile,
    int_money,
    link_product_certifications,
    pick_realistic_wholesale_price,
    pick_retail_price,
    pick_storage_days,
    seed_dealer_age_discount_policy,
    seed_supplier_certifications,
)

# Chạy lệnh tạo db: python manage.py migrate
# Chạy lệnh tạo dữ liệu: python manage.py seed_data --clear
# Ghi chu co dinh: apps/accounts/management/commands/note.md (va backend/SEED_DATA_NOTE.md)

SEED_PASSWORD = "12345678"
DEMO_ACCOUNTS = {
    "admin": {"username": "admin", "email": "admin@example.com", "full_name": "Admin Demo"},
    "dealer": {
        "username": "dealer01",
        "email": "dealer01@example.com",
        "full_name": "Cửa hàng Nông sản Minh Tâm",
    },
    "supplier": {
        "username": "supplier01",
        "email": "supplier01@example.com",
        "full_name": "Đại diện Hợp tác xã Nông nghiệp Xanh Đà Lạt",
    },
    "buyer": {"email": "buyer01@gmail.com", "full_name": "Nguyễn Minh Anh"},
}

class Command(BaseCommand):
    help = 'Seeds the database with realistic mock data.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')
        parser.add_argument('--suppliers', type=int, default=5, help='Number of suppliers')
        parser.add_argument('--dealers', type=int, default=3, help='Number of dealers')
        parser.add_argument('--history-days', type=int, default=120, help='Order/interaction history window (days)')

    def handle(self, *args, **options):
        random.seed(SEED_RANDOM_SEED)
        self.fake = Faker("vi_VN")
        self.fake.seed_instance(SEED_FAKER_SEED)
        clear = options['clear']
        num_suppliers = options['suppliers']
        num_dealers = options['dealers']
        history_days = options['history_days']

        if clear:
            self.stdout.write('Clearing existing data...')
            from apps.marketing.models import (
                CustomerInteraction,
                CustomerSegment,
                CustomerSegmentMember,
                DealerSupplierProductInteraction,
            )
            from apps.orders.models import (
                CustomerPayment,
                OrderReturn,
                OrderReturnItem,
                OrderStatusHistory,
            )

            from apps.loyalty.models import CustomerTierHistory, LoyaltyPointTransaction

            from apps.reviews.models import ProductRecommendation, ProductReview, ReviewImage

            ReviewImage.objects.all().delete()
            ProductReview.objects.all().delete()
            ProductRecommendation.objects.all().delete()
            CustomerTierHistory.objects.all().delete()
            LoyaltyPointTransaction.objects.all().delete()
            OrderReturnItem.objects.all().delete()
            OrderReturn.objects.all().delete()
            CustomerPayment.objects.all().delete()
            OrderStatusHistory.objects.all().delete()
            CustomerInteraction.objects.all().delete()
            DealerSupplierProductInteraction.objects.all().delete()
            Order.objects.all().delete()
            from apps.purchase_orders.models import (
                PurchaseOrder,
                PurchaseOrderPayment,
                PurchaseOrderReturn,
                PurchaseOrderReturnItem,
                PurchaseOrderStatusHistory,
            )

            PurchaseOrderReturnItem.objects.all().delete()
            PurchaseOrderReturn.objects.all().delete()
            PurchaseOrderPayment.objects.all().delete()
            PurchaseOrderStatusHistory.objects.all().delete()
            PurchaseOrder.objects.all().delete()
            DealerInventoryBatch.objects.all().delete()
            from apps.dealer_products.models_age_discount import AgeDiscountPolicy

            AgeDiscountPolicy.objects.all().delete()
            from apps.certifications.models import Certification
            from apps.accounts.models import AccountDocument
            from apps.dealer_products.models import DealerProduct
            from apps.supplier_products.models import CultivationProcess, SupplierProductImage

            Certification.objects.all().delete()
            DealerProduct.objects.all().delete()
            CultivationProcess.objects.all().delete()
            SupplierProductImage.objects.all().delete()
            SupplierProduct.objects.all().delete()
            ProductMaster.objects.all().delete()
            from apps.promotions.models import PromotionTarget, PromotionUsage, Promotion

            PromotionUsage.objects.all().delete()
            PromotionTarget.objects.all().delete()
            Promotion.objects.all().delete()
            CustomerSegmentMember.objects.all().delete()
            CustomerSegment.objects.all().delete()
            CustomerAddress.objects.all().delete()
            CustomerProfile.objects.all().delete()
            DealerProfile.objects.all().delete()
            Supplier.objects.all().delete()
            Category.objects.all().delete()
            AccountDocument.objects.all().delete()
            Account.objects.exclude(is_superuser=True).delete()
            self.stdout.write(self.style.SUCCESS('Cleared database.'))
 
        self.password = make_password(SEED_PASSWORD)
        self.admin_account = self._get_or_create_admin()

        self.stdout.write('Creating system customer segments...')
        self._seed_customer_segments()
 
        self.stdout.write('Creating Categories...')
        self.categories = self._create_categories()

        self.stdout.write('Creating Product Masters...')
        self.product_masters = self._create_product_masters(self.categories)
 
        self.stdout.write(f'Creating {num_suppliers} Suppliers...')
        self.suppliers = self._create_suppliers(num_suppliers)
 
        self.stdout.write(f'Creating {num_dealers} Dealers...')
        self.dealers = self._create_dealers(num_dealers)
 
        if not self.dealers:
            self.stdout.write(self.style.ERROR('No dealers available to create buyers.'))
            return
 
        buyer_counts = [
            DEALER_BUYER_COUNTS[i] if i < len(DEALER_BUYER_COUNTS) else 0
            for i in range(len(self.dealers))
        ]
        total_buyers = sum(buyer_counts)
        self.stdout.write(
            f'Creating {total_buyers} Buyers '
            f'({", ".join(str(c) for c in buyer_counts)} per dealer)...'
        )
        self.buyer_specs = self._create_buyers(self.dealers, buyer_counts=buyer_counts)
 
        self.stdout.write('Creating Supplier Products...')
        self.supplier_products = self._create_supplier_products(self.suppliers, self.categories, self.product_masters)
 
        if not self.supplier_products:
            self.stdout.write(self.style.ERROR('No supplier products available to create dealer products.'))
            return

        self.stdout.write('Creating Dealer Products and Inventory...')
        self._create_dealer_products(self.dealers, self.supplier_products)

        self.stdout.write('Creating customer orders & product interactions...')
        journey_stats = seed_customer_journeys(
            buyer_specs=self.buyer_specs,
            history_days=history_days,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Orders: {journey_stats['orders']} "
                f"(completed: {journey_stats['completed_orders']}), "
                f"interactions: {journey_stats['interactions']}"
            )
        )

        self.stdout.write('Creating purchase orders & supplier cash flow...')
        po_stats = seed_purchase_orders_and_payments(
            dealers=self.dealers,
            suppliers=self.suppliers,
            supplier_products=self.supplier_products,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Purchase orders: {po_stats['purchase_orders']}, "
                f"payments: {po_stats['payments']}, "
                f"returns: {po_stats['returns']}"
            )
        )

        self.stdout.write('Creating product reviews for completed orders...')
        review_stats = seed_product_reviews(self.dealers)
        self.stdout.write(
            self.style.SUCCESS(
                f"Reviews: {review_stats['reviews']} "
                f"(dealer01: {review_stats['dealer_01']} / "
                f"{review_stats.get('products_d1', '?')} SP x3, "
                f"dealer02: {review_stats['dealer_02']} / "
                f"{review_stats.get('products_d2', '?')} SP x1)"
            )
        )

        self.stdout.write(self.style.SUCCESS('Database successfully seeded!'))
        self._print_demo_accounts()

    def _get_or_create_admin(self):
        demo = DEMO_ACCOUNTS["admin"]
        admin, _ = Account.objects.get_or_create(
            username=demo["username"],
            defaults={
                "email": demo["email"],
                "password": self.password,
                "role": AccountRole.ADMIN,
                "status": AccountStatus.ACTIVE,
                "is_staff": True,
                "is_superuser": True,
                "full_name": demo["full_name"],
            },
        )
        admin.email = demo["email"]
        admin.password = self.password
        admin.role = AccountRole.ADMIN
        admin.status = AccountStatus.ACTIVE
        admin.is_staff = True
        admin.is_superuser = True
        admin.full_name = demo["full_name"]
        admin.save()
        return admin

    def _print_demo_accounts(self):
        dealer = self.dealers[0]
        demo = DEMO_ACCOUNTS
        self.stdout.write(
            self.style.SUCCESS(
                f"\n=== Tai khoan demo (mk: {SEED_PASSWORD}) ===\n"
                f"Admin:    {demo['admin']['username']}\n"
                f"Dealer:   {demo['dealer']['username']}\n"
                f"Supplier: {demo['supplier']['username']}\n"
                f"Buyer:    {demo['buyer']['email']}\n"
                f"Store:    /cua-hang/{dealer.slug}/dang-nhap\n"
            )
        )

    def _create_categories(self):
        categories = []
        for name in SEED_CATEGORY_NAMES:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={
                    'description': f'Danh mục {name}',
                    'scope': CategoryScope.SYSTEM,
                    'status': CategoryStatus.ACTIVE,
                    'created_by': self.admin_account,
                    'verified_by': self.admin_account,
                    'verified_at': timezone.now()
                }
            )
            categories.append(cat)
        return categories

    def _create_suppliers(self, count):
        suppliers = []
        demo = DEMO_ACCOUNTS["supplier"]
        for i in range(count):
            company_name = (
                SEED_SUPPLIER_COMPANIES[i]
                if i < len(SEED_SUPPLIER_COMPANIES)
                else f"NCC Seed {i + 1:02d}"
            )
            if i == 0:
                username = demo["username"]
                email = demo["email"]
                full_name = demo["full_name"]
            else:
                username = f"supplier{i + 1:02d}"
                email = f"{username}@example.com"
                full_name = f"Đại diện {company_name}"
            acc = Account.objects.create(
                username=username,
                email=email,
                password=self.password,
                role=AccountRole.SUPPLIER,
                status=AccountStatus.ACTIVE,
                full_name=full_name,
                phone=f"028{1000000 + i:07d}"[:11],
            )
            profile = Supplier.objects.create(
                account=acc,
                company_name=company_name,
                tax_code=f"TAX{10000000 + i:08d}",
                phone=acc.phone,
                address=f"Dia chi NCC seed {i + 1:02d}, TP.HCM",
                verification_status=SupplierVerificationStatus.APPROVED,
                verified_by=self.admin_account,
                verified_at=timezone.now()
            )
            if not hasattr(self, "supplier_certifications"):
                self.supplier_certifications = {}
            self.supplier_certifications[profile.id] = seed_supplier_certifications(
                supplier=profile,
                admin_account=self.admin_account,
                fake=self.fake,
            )
            suppliers.append(profile)
        return suppliers

    def _create_dealers(self, count):
        dealers = []
        demo = DEMO_ACCOUNTS["dealer"]
        for i in range(count):
            store_name = (
                SEED_DEALER_STORE_NAMES[i]
                if i < len(SEED_DEALER_STORE_NAMES)
                else f"Cửa hàng Seed Dealer {i + 1:02d}"
            )
            if i == 0:
                username = demo["username"]
                email = demo["email"]
                full_name = demo["full_name"]
            else:
                username = f"dealer{i + 1:02d}"
                email = f"{username}@example.com"
                full_name = store_name
            slug = SEED_DEALER_SLUGS[i] if i < len(SEED_DEALER_SLUGS) else None
            acc = Account.objects.create(
                username=username,
                email=email,
                password=self.password,
                role=AccountRole.DEALER,
                status=AccountStatus.ACTIVE,
                full_name=full_name,
                phone=f"028{2000000 + i:07d}"[:11],
            )
            profile = DealerProfile.objects.create(
                account=acc,
                store_name=store_name,
                slug=slug,
                store_address=f"Dia chi cua hang seed dealer {i + 1:02d}, TP.HCM",
                status=DealerProfileStatus.ACTIVE,
                verified_by=self.admin_account,
                verified_at=timezone.now()
            )
            dealers.append(profile)
        return dealers

    def _seed_customer_segments(self):
        from apps.marketing.segment_defaults import seed_system_customer_segments

        seed_system_customer_segments()
        self.stdout.write(self.style.SUCCESS('System customer segments ready.'))

    def _create_buyers(self, dealers, *, buyer_counts: list[int]) -> list[BuyerSeedSpec]:
        from apps.customers.services import build_storefront_username

        if not dealers:
            return []

        specs: list[BuyerSeedSpec] = []
        demo_buyer = DEMO_ACCOUNTS["buyer"]

        for dealer_index, dealer in enumerate(dealers):
            count = buyer_counts[dealer_index] if dealer_index < len(buyer_counts) else 0
            for slot in range(count):
                email = seed_buyer_email(
                    dealer_index, slot, demo_email=demo_buyer["email"]
                )
                full_name = seed_buyer_full_name(
                    dealer_index, slot, demo_name=demo_buyer["full_name"]
                )

                username = build_storefront_username(dealer.id, email)
                acc = Account.objects.create(
                    username=username,
                    email=email,
                    password=self.password,
                    role=AccountRole.BUYER,
                    status=AccountStatus.ACTIVE,
                    full_name=full_name,
                    phone=seed_phone(dealer_index, slot),
                    store_dealer=dealer,
                )
                profile = CustomerProfile.objects.create(
                    user=acc,
                    total_orders=0,
                    total_spent=int_money(0),
                    loyalty_points=0,
                    last_order_at=None,
                    note="",
                )
                CustomerAddress.objects.create(
                    customer=profile,
                    receiver_name=acc.full_name,
                    receiver_phone=acc.phone,
                    address=f"Dia chi KH D{dealer_index + 1:02d}-{slot + 1:03d}, TP.HCM",
                    is_default=True,
                )
                tier = resolve_buyer_tier(dealer_index, slot)
                specs.append(
                    BuyerSeedSpec(
                        profile=profile,
                        dealer=dealer,
                        dealer_index=dealer_index,
                        slot=slot,
                        tier=tier,
                    )
                )

        return specs

    def _create_product_masters(self, categories):
        from apps.product_catalog.models import ProductMasterStatus

        product_masters = []
        for cat in categories:
            for name in SEED_PRODUCT_MASTERS.get(cat.name, []):
                slug = self.fake.slug(name)
                pm, _ = ProductMaster.objects.get_or_create(
                    category=cat,
                    slug=slug,
                    defaults={
                        'name': name,
                        'default_unit': 'kg',
                        'description': (
                            f'{name} thuộc nhóm {cat.name}. '
                            f'Nông sản tươi sạch, phù hợp tiêu thụ hàng ngày.'
                        ),
                        'status': ProductMasterStatus.ACTIVE,
                        'sort_order': random.randint(1, 100)
                    }
                )
                product_masters.append(pm)
        return product_masters

    def _create_supplier_products(self, suppliers, categories, product_masters):
        """
        Mỗi SupplierProduct được tạo dựa trên 1 ProductMaster cụ thể,
        và category của SupplierProduct LUÔN lấy từ product_master.category
        (không lấy random từ danh sách categories ngoài), đảm bảo tính nhất quán
        category -> product_master -> supplier_product.
        """
        products = []
        for sup_idx, supplier in enumerate(suppliers):
            # Each supplier has 15-30 products to test scale, bounded by number of available product masters
            num_products = random.randint(15, min(30, len(product_masters)))
            selected_pms = random.sample(product_masters, num_products)
            
            for pm in selected_pms:
                name = f'{pm.name} (NCC {supplier.company_name})'
                unit = pm.default_unit
                slug = f"seed-sp-s{sup_idx + 1}-pm{pm.id}"
                storage_profile = get_storage_profile(pm.category.name)
                storage_days = pick_storage_days(storage_profile)
                master_name = pm.name
                wholesale = pick_realistic_wholesale_price(pm.category.name, master_name)

                prod = SupplierProduct.objects.create(
                    supplier=supplier,
                    category=pm.category,
                    product_master=pm,
                    name=name,
                    slug=slug,
                    unit=unit,
                    wholesale_price=int_money(wholesale),
                    daily_production_capacity=int_money(random.randint(10, 1000)),
                    description=build_supplier_description(pm, supplier.company_name, storage_days),
                    storage_duration_days=storage_days,
                    min_storage_temp=int_money(storage_profile["min_temp"]),
                    max_storage_temp=int_money(storage_profile["max_temp"]),
                    status=SupplierProductStatus.ACTIVE,
                    verified_by=self.admin_account,
                    verified_at=timezone.now()
                )
                create_cultivation_processes(prod)
                certs = getattr(self, "supplier_certifications", {}).get(supplier.id, [])
                link_product_certifications(prod, certs)
                products.append(prod)
        return products

    def _create_dealer_products(self, dealers, supplier_products):
        """
        Mỗi dealer tạo category riêng (CUSTOM) ÁNH XẠ 1-1 với một số category
        hệ thống (vd: 'Rau củ' -> 'Rau sạch hữu cơ (Cửa hàng X)').
        Khi tạo DealerProduct từ một SupplierProduct, category của DealerProduct
        sẽ ưu tiên dùng custom category nếu dealer có category map với
        sp.category, nếu không thì dùng lại category gốc của supplier product.
        Điều này đảm bảo: category (gốc hoặc custom) -> vẫn truy ngược được
        về đúng nhánh category hệ thống ban đầu, tránh gán random gây sai lệch.
        """
        from apps.dealer_products.models import DealerProduct, DealerProductStatus
        from apps.marketing.models import DealerSupplierProductInteraction

        for dealer in dealers:
            seed_dealer_age_discount_policy(dealer)

            system_to_custom = {}
            for sys_cat_name, custom_label in DEALER_CUSTOM_CATEGORY_LABELS.items():
                sys_cat = next((c for c in self.categories if c.name == sys_cat_name), None)
                if not sys_cat:
                    continue
                custom_cat, _ = Category.objects.get_or_create(
                    name=f"{custom_label} ({dealer.store_name})",
                    defaults={
                        'description': f'Danh mục riêng {custom_label} của {dealer.store_name}',
                        'scope': CategoryScope.CUSTOM,
                        'status': CategoryStatus.ACTIVE,
                        'created_by': dealer.account,
                        'verified_by': self.admin_account,
                        'verified_at': timezone.now()
                    }
                )
                system_to_custom[sys_cat.id] = custom_cat

            pool_size = len(supplier_products)
            min_dealer_prods = min(20, pool_size)
            max_dealer_prods = min(45, pool_size)
            num_prods = random.randint(min_dealer_prods, max_dealer_prods)
            selected_supp_prods = random.sample(supplier_products, num_prods)

            for idx, sp in enumerate(selected_supp_prods):
                retail_price = pick_retail_price(sp.wholesale_price)
                title = f'{sp.product_master.name if sp.product_master else sp.name}'
                from apps.dealer_products.canonical_inventory import find_canonical_dealer_product
                if find_canonical_dealer_product(dealer, supplier_product=sp):
                    continue

                dp_category = system_to_custom.get(sp.category_id, sp.category)

                dp = DealerProduct.objects.create(
                    dealer_profile=dealer,
                    supplier_product=sp,
                    product_master_id=sp.product_master_id,
                    category=dp_category,
                    retail_price=retail_price,
                    title=title,
                    description=build_dealer_description(sp, retail_price),
                    status=DealerProductStatus.ACTIVE
                )
                create_dealer_inventory_batches(
                    dealer_product=dp,
                    supplier_product=sp,
                    retail_price=retail_price,
                    force_near_expiry=(dealer == dealers[0] and idx < 5),
                )

                DealerSupplierProductInteraction.objects.get_or_create(
                    dealer=dealer,
                    supplier=sp.supplier,
                    supplier_product=sp,
                    defaults={
                        'view_count': random.randint(10, 50),
                        'add_cart_count': random.randint(5, 15),
                        'purchase_count': random.randint(1, 5),
                        'last_viewed_at': timezone.now() - timedelta(days=random.randint(1, 20)),
                        'last_added_at': timezone.now() - timedelta(days=random.randint(1, 20)),
                        'last_purchased_at': timezone.now() - timedelta(days=random.randint(1, 20))
                    }
                )

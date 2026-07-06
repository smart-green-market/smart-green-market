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
# Gọn:  python manage.py seed_data --clear --buyers 80

SEED_PASSWORD = "12345678"
DEMO_ACCOUNTS = {
    "admin": {"username": "admin", "email": "admin@example.com", "full_name": "Admin Demo"},
    "dealer": {"username": "dealer01", "email": "dealer01@example.com", "full_name": "Dealer Demo"},
    "supplier": {"username": "supplier01", "email": "supplier01@example.com", "full_name": "Supplier Demo"},
    "buyer": {"email": "buyer01@gmail.com", "full_name": "Buyer Demo"},
}

class Command(BaseCommand):
    help = 'Seeds the database with realistic mock data.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')
        parser.add_argument('--suppliers', type=int, default=5, help='Number of suppliers')
        parser.add_argument('--dealers', type=int, default=1, help='Number of dealers')
        parser.add_argument('--buyers', type=int, default=120, help='Number of buyers')
        parser.add_argument('--history-days', type=int, default=120, help='Order/interaction history window (days)')

    def handle(self, *args, **options):
        self.fake = Faker('vi_VN')
        clear = options['clear']
        num_suppliers = options['suppliers']
        num_dealers = options['dealers']
        num_buyers = options['buyers']
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
 
        self.stdout.write(f'Creating {num_buyers} Buyers (Customers)...')
        self.buyers = self._create_buyers(num_buyers, self.dealers)
 
        self.stdout.write('Creating Supplier Products...')
        self.supplier_products = self._create_supplier_products(self.suppliers, self.categories, self.product_masters)
 
        if not self.supplier_products:
            self.stdout.write(self.style.ERROR('No supplier products available to create dealer products.'))
            return

        self.stdout.write('Creating Dealer Products and Inventory...')
        self._create_dealer_products(self.dealers, self.supplier_products)

        self.stdout.write('Creating customer orders & product interactions...')
        journey_stats = seed_customer_journeys(buyers=self.buyers, history_days=history_days)
        self.stdout.write(
            self.style.SUCCESS(
                f"Orders: {journey_stats['orders']} "
                f"(completed: {journey_stats['completed_orders']}), "
                f"interactions: {journey_stats['interactions']}"
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
            if i == 0:
                username = demo["username"]
                email = demo["email"]
                full_name = demo["full_name"]
                company_name = "Cong ty NCC Demo"
            else:
                username = f"supplier{i + 1:02d}"
                email = f"{username}@example.com"
                full_name = self.fake.name()
                company_name = self.fake.company()
            acc = Account.objects.create(
                username=username,
                email=email,
                password=self.password,
                role=AccountRole.SUPPLIER,
                status=AccountStatus.ACTIVE,
                full_name=full_name,
                phone=self.fake.phone_number()[:20]
            )
            profile = Supplier.objects.create(
                account=acc,
                company_name=company_name,
                tax_code=f'TAX{self.fake.random_int(10000000, 99999999)}',
                phone=acc.phone,
                address=self.fake.address(),
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
            if i == 0:
                username = demo["username"]
                email = demo["email"]
                full_name = demo["full_name"]
                store_name = "Cua hang Demo"
            else:
                username = f"dealer{i + 1:02d}"
                email = f"{username}@example.com"
                full_name = self.fake.name()
                store_name = f"Cua hang {self.fake.company()}"
            acc = Account.objects.create(
                username=username,
                email=email,
                password=self.password,
                role=AccountRole.DEALER,
                status=AccountStatus.ACTIVE,
                full_name=full_name,
                phone=self.fake.phone_number()[:20]
            )
            profile = DealerProfile.objects.create(
                account=acc,
                store_name=store_name,
                store_address=self.fake.address(),
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

    def _create_buyers(self, count, dealers):
        from apps.customers.services import build_storefront_username

        buyers = []
        demo_buyer = DEMO_ACCOUNTS["buyer"]
        primary_dealer = dealers[0]
        for i in range(count):
            if i == 0:
                dealer = primary_dealer
                email = demo_buyer["email"]
                full_name = demo_buyer["full_name"]
            else:
                dealer = random.choice(dealers)
                email = f"buyer_{i}_{self.fake.random_int(100, 999)}@example.com"
                full_name = self.fake.name()
            username = build_storefront_username(dealer.id, email)

            acc = Account.objects.create(
                username=username,
                email=email,
                password=self.password,
                role=AccountRole.BUYER,
                status=AccountStatus.ACTIVE,
                full_name=full_name,
                phone=self.fake.phone_number()[:20],
                store_dealer=dealer
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
                address=self.fake.address(),
                is_default=True
            )
            buyers.append(profile)
        return buyers

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
        for supplier in suppliers:
            # Each supplier has 15-30 products to test scale, bounded by number of available product masters
            num_products = random.randint(15, min(30, len(product_masters)))
            selected_pms = random.sample(product_masters, num_products)
            
            for pm in selected_pms:
                name = f'{pm.name} (NCC {supplier.company_name})'
                unit = pm.default_unit
                slug = f'{self.fake.slug()}-{uuid.uuid4().hex[:6]}'
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

                dp_category = system_to_custom.get(sp.category_id, sp.category)

                dp = DealerProduct.objects.create(
                    dealer_profile=dealer,
                    supplier_product=sp,
                    category=dp_category,
                    retail_price=retail_price,
                    title=f'{sp.product_master.name if sp.product_master else sp.name} — bán lẻ',
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

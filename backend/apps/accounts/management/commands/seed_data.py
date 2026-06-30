import random
import uuid
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker

from apps.accounts.models import Account, AccountRole, AccountStatus, AccountDocument, AccountDocumentType, AccountDocumentStatus
from apps.categories.models import Category, CategoryStatus, CategoryScope
from apps.suppliers.models import Supplier, SupplierVerificationStatus
from apps.dealers.models import DealerProfile, DealerProfileStatus
from apps.customers.models import CustomerProfile, CustomerAddress
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus, SupplierProductImage, CultivationProcess
from apps.dealer_products.models import DealerProduct, DealerProductStatus, DealerInventoryBatch
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.product_catalog.models import ProductMaster

# Chạy lệnh clear dữ liệu cũ và tạo dữ liệu mới
# python manage.py seed_data --clear

class Command(BaseCommand):
    help = 'Seeds the database with realistic mock data.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')
        parser.add_argument('--suppliers', type=int, default=5, help='Number of suppliers')
        parser.add_argument('--dealers', type=int, default=1, help='Number of dealers')
        parser.add_argument('--buyers', type=int, default=500, help='Number of buyers')

    def handle(self, *args, **options):
        self.fake = Faker('vi_VN')
        clear = options['clear']
        num_suppliers = options['suppliers']
        num_dealers = options['dealers']
        num_buyers = options['buyers']

        if clear:
            self.stdout.write('Clearing existing data...')
            Order.objects.all().delete()
            PurchaseOrder.objects.all().delete()
            DealerInventoryBatch.objects.all().delete()
            DealerProduct.objects.all().delete()
            CultivationProcess.objects.all().delete()
            SupplierProductImage.objects.all().delete()
            SupplierProduct.objects.all().delete()
            ProductMaster.objects.all().delete()
            CustomerAddress.objects.all().delete()
            CustomerProfile.objects.all().delete()
            DealerProfile.objects.all().delete()
            Supplier.objects.all().delete()
            Category.objects.all().delete()
            AccountDocument.objects.all().delete()
            Account.objects.exclude(is_superuser=True).delete()
            self.stdout.write(self.style.SUCCESS('Cleared database.'))
 
        self.password = make_password('12345678')
        self.admin_account = self._get_or_create_admin()
 
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

        self.stdout.write('Creating Purchase Orders...')
        self._create_purchase_orders(self.dealers, self.supplier_products)

        self.stdout.write('Creating Orders...')
        self._create_orders(self.buyers, self.dealers)

        self.stdout.write(self.style.SUCCESS('Database successfully seeded!'))

    def _get_or_create_admin(self):
        admin = Account.objects.filter(is_superuser=True).first()
        if admin:
            return admin
            
        admin, created = Account.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin_seed@example.com',
                'password': self.password,
                'role': AccountRole.ADMIN,
                'status': AccountStatus.ACTIVE,
                'is_staff': True,
                'is_superuser': True,
                'full_name': 'Admin User'
            }
        )
        return admin

    def _create_categories(self):
        names = [
    'Rau ăn lá',
    'Rau ăn củ',
    'Rau ăn quả',
    'Rau gia vị & rau thơm',
    'Nấm các loại',
    'Trái cây nhiệt đới',
    'Trái cây có múi',
    'Trái cây ôn đới & nhập khẩu',
    'Quả mọng & đặc sản',
    'Đậu & hạt tươi',
    'Gạo & Ngũ cốc',
    'Đậu khô & hạt khô',
    'Thực phẩm khô',
    'Nông sản sấy khô',
    'Gia vị',
    'Mật ong & sản phẩm từ ong',
    'Trứng gia cầm',
    'Sữa & sản phẩm từ sữa nông trại',
    'Thực phẩm lên men & muối chua',
    'Hoa & cây giống nông nghiệp'
]
        categories = []
        for name in names:
            cat, created = Category.objects.get_or_create(
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
        for i in range(count):
            username = f'supplier_{i}'
            acc = Account.objects.create(
                username=username,
                email=f'{username}@example.com',
                password=self.password,
                role=AccountRole.SUPPLIER,
                status=AccountStatus.ACTIVE,
                full_name=self.fake.name(),
                phone=self.fake.phone_number()[:20]
            )
            profile = Supplier.objects.create(
                account=acc,
                company_name=self.fake.company(),
                tax_code=f'TAX{self.fake.random_int(10000000, 99999999)}',
                phone=acc.phone,
                address=self.fake.address(),
                verification_status=SupplierVerificationStatus.APPROVED,
                verified_by=self.admin_account,
                verified_at=timezone.now()
            )
            suppliers.append(profile)
        return suppliers

    def _create_dealers(self, count):
        dealers = []
        for i in range(count):
            username = f'dealer_{i}'
            acc = Account.objects.create(
                username=username,
                email=f'{username}@example.com',
                password=self.password,
                role=AccountRole.DEALER,
                status=AccountStatus.ACTIVE,
                full_name=self.fake.name(),
                phone=self.fake.phone_number()[:20]
            )
            profile = DealerProfile.objects.create(
                account=acc,
                store_name=f'Cửa hàng {self.fake.company()}',
                store_address=self.fake.address(),
                status=DealerProfileStatus.ACTIVE,
                verified_by=self.admin_account,
                verified_at=timezone.now()
            )
            dealers.append(profile)
        return dealers

    def _create_buyers(self, count, dealers):
        from apps.customers.services import build_storefront_username

        buyers = []
        for i in range(count):
            dealer = random.choice(dealers)
            email = f"buyer_{i}_{self.fake.random_int(100, 999)}@example.com"
            username = build_storefront_username(dealer.id, email)
            
            acc = Account.objects.create(
                username=username,
                email=email,
                password=self.password,
                role=AccountRole.BUYER,
                status=AccountStatus.ACTIVE,
                full_name=self.fake.name(),
                phone=self.fake.phone_number()[:20],
                store_dealer=dealer
            )
            profile = CustomerProfile.objects.create(
                user=acc,
                total_orders=self.fake.random_int(0, 50),
                total_spent=Decimal(self.fake.random_int(0, 10000000)),
                loyalty_points=self.fake.random_int(0, 1000),
                last_order_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                note=f"Khách hàng quen thuộc của cửa hàng. {self.fake.sentence()}"
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
        # pyrefly: ignore [missing-import]
        from apps.product_catalog.models import ProductMasterStatus
        master_data = {
    'Rau ăn lá': [
        'Rau cải ngọt', 'Rau muống', 'Cải thìa', 'Cải bó xôi', 'Mồng tơi',
        'Rau dền', 'Xà lách', 'Cải xoăn kale', 'Rau ngót', 'Cải cúc',
        'Rau lang', 'Rau đay', 'Cải bẹ xanh', 'Xà lách xoong', 'Rau chân vịt'
    ],
    'Rau ăn củ': [
        'Khoai tây', 'Cà rốt Đà Lạt', 'Củ cải trắng', 'Su hào', 'Khoai lang mật',
        'Củ dền', 'Củ sắn (củ đậu)', 'Gừng', 'Nghệ tươi', 'Khoai môn',
        'Khoai mỡ', 'Củ niễng', 'Khoai sọ', 'Riềng', 'Sả củ'
    ],
    'Rau ăn quả': [
        'Cà chua Đà Lạt', 'Bí đỏ', 'Bí xanh', 'Bầu', 'Mướp hương',
        'Khổ qua', 'Dưa leo', 'Ớt chuông', 'Cà tím', 'Đậu cô ve',
        'Mướp đắng rừng', 'Bí ngòi', 'Cà pháo', 'Đậu rồng', 'Su su'
    ],
    'Rau gia vị & rau thơm': [
        'Hành lá', 'Ngò rí', 'Húng quế', 'Tía tô', 'Rau răm',
        'Húng lủi', 'Diếp cá', 'Kinh giới', 'Ngò gai', 'Lá lốt',
        'Thì là', 'Húng chanh', 'Sả lá', 'Rau mùi tàu', 'Lá chanh'
    ],
    'Nấm các loại': [
        'Nấm rơm', 'Nấm bào ngư', 'Nấm kim châm', 'Nấm hương tươi', 'Nấm đùi gà',
        'Nấm linh chi', 'Nấm mèo tươi', 'Nấm sò trắng', 'Nấm đông cô tươi', 'Nấm tuyết',
        'Nấm mỡ', 'Nấm hải sản', 'Nấm trứng gà', 'Nấm chân dài', 'Nấm bụng dê'
    ],
    'Trái cây nhiệt đới': [
        'Xoài Cát Chu', 'Chuối già Nam Mỹ', 'Dứa Đồng Giao', 'Đu đủ chín', 'Mít Thái',
        'Sầu riêng Ri6', 'Thanh long ruột đỏ', 'Mãng cầu xiêm', 'Dừa xiêm', 'Ổi Đông Dư',
        'Chuối sứ', 'Xoài keo', 'Mãng cầu ta', 'Đu đủ xanh', 'Mít ướt'
    ],
    'Trái cây có múi': [
        'Cam sành', 'Quýt đường', 'Bưởi da xanh', 'Chanh không hạt', 'Cam Vinh',
        'Bưởi năm roi', 'Quýt hồng', 'Chanh dây', 'Cam xoàn', 'Tắc (quất)',
        'Bưởi diễn', 'Cam canh', 'Quýt đường Lai Vung', 'Chanh giấy', 'Cam sành Hà Giang'
    ],
    'Trái cây ôn đới & nhập khẩu': [
        'Táo Phan Rang', 'Lê Hàn Quốc', 'Nho xanh Ninh Thuận', 'Kiwi vàng', 'Dưa lưới',
        'Táo Envy', 'Nho đen không hạt', 'Lê Nam Phi', 'Cherry nhập khẩu', 'Việt quất',
        'Mâm xôi đỏ', 'Táo Fuji', 'Lựu đỏ', 'Hồng giòn', 'Mận hậu'
    ],
    'Quả mọng & đặc sản': [
        'Vải thiều Lục Ngạn', 'Nhãn lồng Hưng Yên', 'Chôm chôm', 'Măng cụt', 'Dâu tây Đà Lạt',
        'Bòn bon', 'Roi đỏ', 'Sapoche (hồng xiêm)', 'Khế ngọt', 'Vú sữa Lò Rèn',
        'Dưa hấu Long An', 'Bơ sáp Đắk Lắk', 'Quả na', 'Trái dừa sáp', 'Quả dứa mật'
    ],
    'Đậu & hạt tươi': [
        'Đậu cô ve', 'Đậu bắp', 'Đậu Hà Lan', 'Măng tây', 'Đậu rồng tươi',
        'Bắp non', 'Bắp ngọt trái', 'Đậu phộng tươi', 'Đậu nành tươi (edamame)', 'Hạt sen tươi',
        'Củ năng', 'Bông cải trắng', 'Súp lơ xanh', 'Atiso tươi', 'Bông bí'
    ],
    'Gạo & Ngũ cốc': [
        'Gạo ST25', 'Gạo lứt huyết rồng', 'Yến mạch', 'Đậu xanh tách vỏ', 'Gạo nàng thơm chợ Đào',
        'Gạo nếp cái hoa vàng', 'Gạo japonica', 'Gạo tấm', 'Hạt kê', 'Gạo lứt đỏ',
        'Bột yến mạch nguyên cám', 'Gạo nếp than', 'Hạt diêm mạch (quinoa)', 'Gạo thơm Lài', 'Bắp khô hạt'
    ],
    'Đậu khô & hạt khô': [
        'Hạt điều rang muối', 'Hạt sen khô', 'Đậu đen', 'Đậu phộng', 'Đậu đỏ',
        'Hạt macca', 'Hạt óc chó', 'Hạt hạnh nhân', 'Đậu trắng', 'Hạt bí rang',
        'Hạt hướng dương', 'Đậu lăng', 'Hạt dẻ cười', 'Đậu Hà Lan khô', 'Hạt chia'
    ],
    'Thực phẩm khô': [
        'Nấm hương khô', 'Mộc nhĩ', 'Bánh đa cua', 'Miến dong', 'Bún khô',
        'Phở khô', 'Bánh tráng phơi sương', 'Tôm khô', 'Cá cơm khô', 'Rong biển khô',
        'Mì gạo khô', 'Bánh phồng tôm', 'Khô mực', 'Hủ tiếu khô', 'Bột năng'
    ],
    'Nông sản sấy khô': [
        'Chuối sấy giòn', 'Mít sấy', 'Khoai lang sấy', 'Xoài sấy dẻo', 'Mãng cầu sấy',
        'Đu đủ sấy', 'Dứa sấy', 'Cà chua sấy khô', 'Cải kale sấy', 'Khoai môn sấy',
        'Táo sấy dẻo', 'Cam sấy lát', 'Gừng sấy dẻo', 'Bí đỏ sấy', 'Rong biển sấy'
    ],
    'Gia vị': [
        'Hạt tiêu Phú Quốc', 'Nước mắm Phú Quốc', 'Tỏi Lý Sơn', 'Ớt chỉ thiên', 'Muối tôm Tây Ninh',
        'Sa tế', 'Bột nghệ', 'Bột ớt', 'Hạt nêm rau củ', 'Tương ớt',
        'Nước tương', 'Dầu hào', 'Quế chi', 'Hoa hồi', 'Lá nguyệt quế'
    ],
    'Mật ong & sản phẩm từ ong': [
        'Mật ong rừng', 'Sữa ong chúa', 'Phấn hoa', 'Mật ong hoa nhãn', 'Mật ong hoa cà phê',
        'Mật ong bạc hà', 'Keo ong (propolis)', 'Mật ong rừng U Minh', 'Sáp ong nguyên chất', 'Mật ong hoa vải',
        'Mật ong chanh đào', 'Trà mật ong gừng', 'Mật ong nghệ', 'Mật ong hoa cúc', 'Mật ong rừng Tây Bắc'
    ],
    'Trứng gia cầm': [
        'Trứng gà ta', 'Trứng vịt', 'Trứng vịt muối', 'Trứng cút', 'Trứng gà công nghiệp',
        'Trứng vịt lộn', 'Trứng gà ác', 'Trứng ngỗng', 'Trứng cút lộn', 'Trứng gà so',
        'Trứng vịt bắc thảo', 'Trứng gà hữu cơ', 'Trứng gà Đông Tảo', 'Trứng vịt trời', 'Trứng gà thả vườn'
    ],
    'Sữa & sản phẩm từ sữa nông trại': [
        'Sữa tươi nông trại', 'Sữa chua nếp cẩm', 'Phô mai tươi', 'Sữa chua Hy Lạp', 'Sữa dê tươi',
        'Bơ tươi nông trại', 'Sữa chua uống', 'Phô mai que', 'Váng sữa', 'Sữa chua trái cây',
        'Kem tươi nông trại', 'Sữa tươi thanh trùng', 'Sữa hạt óc chó', 'Sữa đậu nành nguyên chất', 'Sữa chua không đường'
    ],
    'Thực phẩm lên men & muối chua': [
        'Dưa cải muối', 'Kim chi', 'Cà pháo muối', 'Măng chua', 'Củ kiệu muối',
        'Dưa món', 'Cải chua', 'Hành muối', 'Tỏi muối', 'Sung muối',
        'Đu đủ muối chua', 'Rau cải muối xổi', 'Ớt muối', 'Dưa leo muối', 'Mơ muối'
    ],
    'Hoa & cây giống nông nghiệp': [
        'Hoa hồng Đà Lạt', 'Hoa cúc', 'Cây giống rau', 'Hạt giống hoa', 'Hoa lan hồ điệp',
        'Hoa ly', 'Cây giống cà chua', 'Cây giống ớt', 'Hạt giống rau cải', 'Cây giống dưa leo',
        'Hoa hướng dương', 'Cây giống bầu bí', 'Hạt giống rau muống', 'Cây giống xoài', 'Hạt giống dưa hấu'
    ]
}
        
        product_masters = []
        for cat in categories:
            names = master_data.get(cat.name, [])
            for name in names:
                slug = self.fake.slug(name)
                pm, created = ProductMaster.objects.get_or_create(
                    category=cat,
                    slug=slug,
                    defaults={
                        'name': name,
                        'default_unit': 'kg' if cat.name not in ['Thủy hải sản', 'Gạo & Ngũ cốc', 'Gia vị'] else 'gói',
                        'description': f'Sản phẩm chuẩn hệ thống cho {name}',
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
                
                prod = SupplierProduct.objects.create(
                    supplier=supplier,
                    category=pm.category,
                    product_master=pm,
                    name=name,
                    slug=slug,
                    unit=unit,
                    wholesale_price=Decimal(self.fake.random_int(10000, 500000)),
                    daily_production_capacity=Decimal(self.fake.random_int(10, 1000)),
                    status=SupplierProductStatus.ACTIVE,
                    verified_by=self.admin_account,
                    verified_at=timezone.now()
                )
                # create steps
                for step_order in range(1, 4):
                    CultivationProcess.objects.create(
                        supplier_product=prod,
                        step_order=step_order,
                        process_name=f'Quy trình {step_order}',
                        description=self.fake.text()
                    )
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
        from apps.marketing.models import DealerSupplierProductInteraction

        # Map: tên category hệ thống -> tên category custom muốn tạo cho dealer
        custom_category_map = {
            'Rau củ': 'Rau sạch hữu cơ',
            'Trái cây': 'Trái cây đặc sản',
            'Gia vị': 'Gia vị cao cấp',
        }

        for dealer in dealers:
            # Tạo custom category cho dealer, map theo từng category hệ thống cụ thể
            # key: id của category hệ thống gốc -> value: Category custom tương ứng
            system_to_custom = {}
            for sys_cat_name, custom_label in custom_category_map.items():
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

            num_prods = random.randint(30, 60)
            selected_supp_prods = random.sample(supplier_products, min(num_prods, len(supplier_products)))

            for sp in selected_supp_prods:
                retail_price = sp.wholesale_price * Decimal(random.uniform(1.1, 1.5))

                # Category của DealerProduct: ưu tiên custom category nếu có map
                # đúng với category gốc của supplier product (sp.category),
                # nếu không có map thì dùng lại category gốc (sp.category).
                dp_category = system_to_custom.get(sp.category_id, sp.category)

                dp = DealerProduct.objects.create(
                    dealer_profile=dealer,
                    supplier_product=sp,
                    category=dp_category,
                    retail_price=retail_price.quantize(Decimal('1.00')),
                    title=f'{sp.name} (Bán lẻ)',
                    status=DealerProductStatus.ACTIVE
                )
                DealerInventoryBatch.objects.create(
                    dealer_product=dp,
                    batch_number=f'BATCH-{uuid.uuid4().hex[:6].upper()}',
                    quantity=100,
                    remaining_quantity=random.randint(10, 100),
                    import_price=sp.wholesale_price,
                    import_date=timezone.now().date() - timedelta(days=random.randint(1, 30))
                )

                # Create B2B interaction between dealer and supplier product
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

    def _create_purchase_orders(self, dealers, supplier_products):
        for dealer in dealers:
            num_pos = random.randint(20, 50)
            for _ in range(num_pos):
                sp = random.choice(supplier_products)
                supplier = sp.supplier
                total_amount = Decimal(0)
                po = PurchaseOrder.objects.create(
                    order_code=f'PO-{uuid.uuid4().hex[:8].upper()}',
                    supplier=supplier,
                    dealer=dealer,
                    status=random.choice(PurchaseOrderStatus.choices)[0],
                    delivery_address=dealer.store_address,
                    requested_delivery_time=timezone.now() + timedelta(days=random.randint(1, 7)),
                    receiver_name=dealer.account.full_name,
                    receiver_phone=dealer.account.phone,
                )
                
                num_items = random.randint(2, 6)
                for _ in range(num_items):
                    item_sp = random.choice([p for p in supplier_products if p.supplier == supplier])
                    qty = Decimal(random.randint(50, 200))
                    price = item_sp.wholesale_price
                    subtotal = qty * price
                    total_amount += subtotal
                    PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        supplier_product=item_sp,
                        quantity=qty,
                        unit_price=price,
                        subtotal=subtotal
                    )
                
                po.total_amount = total_amount
                po.debt_amount = total_amount
                po.save()

    def _generate_realistic_order_time(self):
        # Choose a random day in the last 30 days
        day_offset = random.randint(1, 30)
        base_date = timezone.now() - timedelta(days=day_offset)
        
        # Weekend boost (approx. 20-30% higher volume)
        # Shift weekday to weekend with a 25% probability
        weekday = base_date.weekday()
        if weekday < 5 and random.random() < 0.25:
            # Shift to Saturday (5) or Sunday (6)
            days_to_shift = (5 if random.random() < 0.5 else 6) - weekday
            base_date += timedelta(days=days_to_shift)
            
        # Peak hour distribution:
        # Peak: 7-9h and 17-20h
        if random.random() < 0.65:
            if random.random() < 0.5:
                hour = random.randint(7, 9)
            else:
                hour = random.randint(17, 20)
        else:
            off_peak = [h for h in range(24) if h not in [7, 8, 9, 17, 18, 19, 20]]
            hour = random.choice(off_peak)
            
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        return base_date.replace(hour=hour, minute=minute, second=second)

    def _create_orders(self, buyers, dealers):
        from apps.marketing.models import CustomerInteraction

        for buyer in buyers:
            num_orders = random.randint(1, 3)  # Optimized to speed up seeding
            dealer = buyer.user.store_dealer
            if not dealer:
                continue
                
            dealer_prods = list(DealerProduct.objects.filter(dealer_profile=dealer, status=DealerProductStatus.ACTIVE))
            if not dealer_prods:
                continue
                
            for _ in range(num_orders):
                address = CustomerAddress.objects.filter(customer=buyer).first()
                if not address:
                    continue
                
                # Determine number of items using random.choices with weights
                ranges = [(1, 2), (3, 4), (5, 7), (8, 15)]
                weights = [0.50, 0.30, 0.15, 0.05]
                chosen_range = random.choices(ranges, weights=weights)[0]
                num_items = random.randint(chosen_range[0], chosen_range[1])
                
                # Determine if this order is a standard small order (92% probability) or large order (8% probability)
                is_large_order = random.random() < 0.08

                # Generate realistic time
                created_at = self._generate_realistic_order_time()
                delivered_at = created_at + timedelta(hours=random.randint(2, 6))
                completed_at = delivered_at + timedelta(hours=random.randint(1, 12))

                total_amount = Decimal(0)
                order = Order.objects.create(
                    order_code=f'ORD-{uuid.uuid4().hex[:8].upper()}',
                    customer=buyer,
                    dealer=dealer,
                    customer_address=address,
                    status=OrderStatus.COMPLETED,
                    receiver_name=address.receiver_name,
                    receiver_phone=address.receiver_phone,
                    delivery_address=address.address,
                    delivery_time=delivered_at,
                    completed_at=completed_at,
                    delivered_at=delivered_at,
                )
                
                # Sample unique products up to num_items
                sampled_prods = random.sample(dealer_prods, min(num_items, len(dealer_prods)))
                for dp in sampled_prods:
                    batch = DealerInventoryBatch.objects.filter(dealer_product=dp).first()
                    if not batch:
                        continue
                        
                    # Quantity logic based on standard vs large order
                    if is_large_order:
                        qty = random.randint(5, 15)
                    else:
                        # Standard order: if expensive product (> 100k VNĐ), buy 1. Otherwise, buy 1-3.
                        if dp.retail_price > 100000:
                            qty = 1
                        else:
                            qty = random.randint(1, 3)

                    price = dp.retail_price
                    subtotal = qty * price
                    total_amount += subtotal
                    
                    OrderItem.objects.create(
                        order=order,
                        dealer_product=dp,
                        batch=batch,
                        product_title=dp.title,
                        unit=dp.supplier_product.unit,
                        quantity=qty,
                        unit_price=price,
                        import_price=batch.import_price,
                        subtotal=subtotal
                    )

                    # Create or update Customer Interaction (with realistic timestamps matching created_at)
                    interaction, created = CustomerInteraction.objects.get_or_create(
                        customer=buyer,
                        dealer=dealer,
                        dealer_product=dp,
                        defaults={
                            'view_count': random.randint(5, 20),
                            'add_cart_count': random.randint(2, 8),
                            'purchase_count': qty,
                            'last_viewed_at': created_at - timedelta(minutes=random.randint(5, 30)),
                            'last_added_at': created_at - timedelta(minutes=random.randint(2, 10)),
                            'last_purchased_at': created_at
                        }
                    )
                    if not created:
                        interaction.view_count += random.randint(1, 5)
                        interaction.add_cart_count += random.randint(1, 2)
                        interaction.purchase_count += qty
                        interaction.last_purchased_at = created_at
                        interaction.save(update_fields=['view_count', 'add_cart_count', 'purchase_count', 'last_purchased_at', 'updated_at'])
                
                order.subtotal_amount = total_amount
                order.total_amount = total_amount
                order.paid_amount = total_amount
                order.debt_amount = Decimal('0.00')
                order.save()

                # Override created_at which was auto_now_added
                Order.objects.filter(pk=order.pk).update(created_at=created_at)

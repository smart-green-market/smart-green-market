"""Helper sinh dữ liệu sản phẩm realistic cho seed_data."""

from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

# Giá sỉ Supplier -> Dealer (VND/kg), làm tròn nghìn đồng.
PRODUCT_WHOLESALE_PRICE_RANGES = {
    "Rau ăn lá": {
        "Rau cải ngọt": (9000, 15000),
        "Rau muống": (8000, 13000),
        "Cải thìa": (10000, 17000),
        "Cải bó xôi": (18000, 28000),
        "Mồng tơi": (8000, 14000),
        "Rau dền": (8000, 14000),
        "Xà lách": (14000, 24000),
        "Cải xoăn kale": (35000, 60000),
        "Rau ngót": (15000, 25000),
        "Cải cúc": (12000, 20000),
        "Rau lang": (8000, 14000),
        "Rau đay": (7000, 13000),
        "Cải bẹ xanh": (9000, 15000),
        "Xà lách xoong": (22000, 35000),
        "Rau chân vịt": (25000, 42000),
    },
    "Rau ăn củ": {
        "Khoai tây": (18000, 26000),
        "Cà rốt Đà Lạt": (22000, 30000),
        "Củ cải trắng": (8000, 14000),
        "Su hào": (10000, 17000),
        "Khoai lang mật": (20000, 35000),
        "Củ dền": (12000, 20000),
        "Củ sắn (củ đậu)": (8000, 13000),
        "Gừng": (28000, 45000),
        "Nghệ tươi": (18000, 30000),
        "Khoai môn": (22000, 38000),
        "Khoai mỡ": (25000, 42000),
        "Củ niễng": (45000, 75000),
        "Khoai sọ": (18000, 32000),
        "Riềng": (18000, 28000),
        "Sả củ": (10000, 18000),
    },
    "Rau ăn quả": {
        "Cà chua Đà Lạt": (14000, 24000),
        "Bí đỏ": (12000, 20000),
        "Bí xanh": (10000, 18000),
        "Bầu": (10000, 18000),
        "Mướp hương": (12000, 22000),
        "Khổ qua": (18000, 28000),
        "Dưa leo": (10000, 18000),
        "Ớt chuông": (35000, 60000),
        "Cà tím": (12000, 22000),
        "Đậu cô ve": (22000, 32000),
        "Mướp đắng rừng": (35000, 65000),
        "Bí ngòi": (25000, 45000),
        "Cà pháo": (12000, 22000),
        "Đậu rồng": (18000, 30000),
        "Su su": (8000, 15000),
    },
}

SEED_CATEGORY_NAMES = list(PRODUCT_WHOLESALE_PRICE_RANGES.keys())

SEED_PRODUCT_MASTERS: dict[str, list[str]] = {
    category: list(products.keys())
    for category, products in PRODUCT_WHOLESALE_PRICE_RANGES.items()
}

# Tên danh mục custom dealer hiển thị trên storefront (map 1-1 với category hệ thống).
DEALER_CUSTOM_CATEGORY_LABELS: dict[str, str] = {
    "Rau ăn lá": "Rau sạch hữu cơ",
    "Rau ăn củ": "Củ quả tươi",
    "Rau ăn quả": "Rau quả sạch",
}

DEFAULT_WHOLESALE_PRICE_RANGE = (12000, 30000)


def int_money(amount) -> Decimal:
    """Chuẩn hóa tiền seed thành số nguyên (VND)."""
    return Decimal(max(0, int(amount)))


def pick_realistic_wholesale_price(category_name: str, product_name: str) -> int:
    """Chọn giá sỉ thực tế, làm tròn theo 1.000đ."""
    category_prices = PRODUCT_WHOLESALE_PRICE_RANGES.get(category_name, {})
    low, high = category_prices.get(product_name, DEFAULT_WHOLESALE_PRICE_RANGE)
    return random.randrange(low, high + 1000, 1000)


def pick_retail_price(wholesale_price, *, markup_percent: int | None = None) -> Decimal:
    """Giá bán lẻ = giá sỉ * markup (110%–150%), luôn là số nguyên."""
    markup = markup_percent or random.randint(110, 150)
    return int_money(int(wholesale_price) * markup // 100)

from apps.dealer_products.inventory_expiry import (
    compute_batch_expiry_date,
    compute_batch_production_date,
)
from apps.dealer_products.models import DealerInventoryBatch, DealerInventoryBatchStatus
from apps.supplier_products.models import CultivationProcess

# (storage_days_min, storage_days_max), nhiệt độ °C
CATEGORY_STORAGE_PROFILES: dict[str, dict] = {
    "Rau ăn lá": {"storage_days": (3, 7), "min_temp": 0, "max_temp": 5},
    "Rau ăn củ": {"storage_days": (7, 21), "min_temp": 4, "max_temp": 12},
    "Rau ăn quả": {"storage_days": (4, 10), "min_temp": 8, "max_temp": 13},

}

DEFAULT_STORAGE_PROFILE = {
    "storage_days": (7, 14),
    "min_temp": 4,
    "max_temp": 12,
}

CULTIVATION_STEPS = [
    ("Chuẩn bị đất & chọn giống", "Kiểm tra pH, làm sạch mầm bệnh, chọn giống sạch đạt chuẩn VietGAP."),
    ("Canh tác & chăm sóc", "Tưới tiêu định kỳ, bón phân hữu cơ, theo dõi sâu bệnh và nhật ký canh tác."),
    ("Thu hoạch & sơ chế", "Thu hoạch đúng độ chín, rửa sạch, phân loại và đóng gói tại ruộng/vườn."),
    ("Kiểm định & giao hàng", "Kiểm tra chất lượng, dán tem truy xuất, vận chuyển mát trong vòng 24 giờ."),
]


def get_storage_profile(category_name: str) -> dict:
    return CATEGORY_STORAGE_PROFILES.get(category_name, DEFAULT_STORAGE_PROFILE)


def pick_storage_days(profile: dict) -> int:
    low, high = profile["storage_days"]
    return random.randint(low, high)


def build_supplier_description(product_master, supplier_name: str, storage_days: int) -> str:
    return (
        f"{product_master.name} do {supplier_name} cung cấp. "
        f"Nông sản được thu hoạch tươi, đạt chuẩn an toàn thực phẩm. "
        f"Bảo quản mát {storage_days} ngày kể từ ngày sản xuất. "
        f"Đơn vị tính: {product_master.default_unit}."
    )


def build_dealer_description(supplier_product, retail_price) -> str:
    return (
        f"{supplier_product.name} — bán lẻ tại cửa hàng. "
        f"Giá niêm yết {int(retail_price):,} đ/{supplier_product.unit}. "
        f"Hàng nhập trực tiếp từ NCC {supplier_product.supplier.company_name}, "
        f"giao trong ngày khu vực nội thành."
    )


def create_cultivation_processes(supplier_product) -> None:
    for step_order, (process_name, description) in enumerate(CULTIVATION_STEPS, start=1):
        CultivationProcess.objects.create(
            supplier_product=supplier_product,
            step_order=step_order,
            process_name=process_name,
            description=description,
        )


def _batch_dates_for_fresh_import(supplier_product, import_date):
    expiry = compute_batch_expiry_date(import_date, supplier_product)
    production = compute_batch_production_date(
        import_date,
        supplier_product,
        expiry_date=expiry,
    )
    return production, expiry


def create_dealer_inventory_batches(
    *,
    dealer_product,
    supplier_product,
    retail_price,
    force_near_expiry: bool = False,
) -> list[DealerInventoryBatch]:
    """Tạo một lô MAIN duy nhất với tồn ngẫu nhiên."""
    from apps.dealer_products.canonical_inventory import CANONICAL_BATCH_NUMBER

    today = timezone.localdate()
    qty = random.randint(80, 150)
    remaining = random.randint(max(1, qty // 2), qty)
    import_date = today - timedelta(days=random.randint(1, 5))
    prod, exp = _batch_dates_for_fresh_import(supplier_product, import_date)
    manual_price = None
    if force_near_expiry:
        exp = today + timedelta(days=random.randint(2, 4))

    return [
        DealerInventoryBatch.objects.create(
            dealer_product=dealer_product,
            batch_number=CANONICAL_BATCH_NUMBER,
            quantity=qty,
            remaining_quantity=remaining,
            import_price=int_money(supplier_product.wholesale_price),
            import_date=import_date,
            production_date=prod,
            expiry_date=exp,
            manual_sale_price=manual_price,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
    ]


def seed_supplier_certifications(*, supplier, admin_account, fake) -> list:
    from apps.certifications.models import Certification, CertificationStatus

    templates = [
        ("Chung nhan VietGAP", "VietGAP", "Bo NN&PTNT"),
        ("Chung nhan huu co", "Organic-VN", "Control Union"),
    ]
    certs = []
    today = timezone.localdate()
    for name, code_prefix, issued_by in templates:
        cert = Certification.objects.create(
            supplier=supplier,
            name=name,
            certificate_code=f"{code_prefix}-{fake.random_int(10000, 99999)}",
            issued_by=issued_by,
            issue_date=today - timedelta(days=random.randint(180, 720)),
            expiry_date=today + timedelta(days=random.randint(180, 540)),
            description=f"{name} cho nong san tu {supplier.company_name}",
            status=CertificationStatus.APPROVED,
            verified_by=admin_account,
            verified_at=timezone.now(),
        )
        certs.append(cert)
    return certs


def link_product_certifications(supplier_product, certifications: list) -> None:
    if not certifications:
        return
    from apps.certifications.models import SupplierProductCertification

    for cert in random.sample(certifications, k=min(len(certifications), random.randint(1, len(certifications)))):
        SupplierProductCertification.objects.get_or_create(
            supplier_product=supplier_product,
            certification=cert,
        )


def seed_dealer_age_discount_policy(dealer) -> None:
    from apps.dealer_products.models_age_discount import (
        AgeDiscountDiscountType,
        AgeDiscountPolicy,
        AgeDiscountScope,
    )

    from datetime import time

    AgeDiscountPolicy.objects.get_or_create(
        dealer=dealer,
        title="Giam gia theo khung gio",
        defaults={
            "scope": AgeDiscountScope.ALL,
            "discount_type": AgeDiscountDiscountType.PERCENT,
            "discount_value": int_money(15),
            "priority": 10,
            "is_active": True,
            "daily_start_time": time(7, 0),
            "daily_end_time": time(10, 0),
        },
    )

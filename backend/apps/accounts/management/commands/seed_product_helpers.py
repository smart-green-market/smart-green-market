"""Helper sinh dữ liệu sản phẩm realistic cho seed_data."""

from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.dealer_products.inventory_expiry import (
    compute_batch_expiry_date,
    compute_batch_production_date,
)
from apps.dealer_products.models import DealerInventoryBatch, DealerInventoryBatchStatus
from apps.supplier_products.models import CultivationProcess

# (storage_days_min, storage_days_max), nhiệt độ °C
CATEGORY_STORAGE_PROFILES: dict[str, dict] = {
    "Rau ăn lá": {"storage_days": (3, 6), "min_temp": 2, "max_temp": 8},
    "Rau ăn củ": {"storage_days": (7, 14), "min_temp": 4, "max_temp": 10},
    "Rau ăn quả": {"storage_days": (5, 10), "min_temp": 4, "max_temp": 12},
    "Rau gia vị & rau thơm": {"storage_days": (5, 9), "min_temp": 2, "max_temp": 8},
    "Nấm các loại": {"storage_days": (3, 5), "min_temp": 2, "max_temp": 6},
    "Trái cây nhiệt đới": {"storage_days": (5, 12), "min_temp": 6, "max_temp": 14},
    "Trái cây có múi": {"storage_days": (10, 21), "min_temp": 4, "max_temp": 12},
    "Trái cây ôn đới & nhập khẩu": {"storage_days": (7, 14), "min_temp": 2, "max_temp": 8},
    "Quả mọng & đặc sản": {"storage_days": (3, 7), "min_temp": 2, "max_temp": 8},
    "Đậu & hạt tươi": {"storage_days": (4, 8), "min_temp": 4, "max_temp": 10},
    "Gạo & Ngũ cốc": {"storage_days": (180, 365), "min_temp": 15, "max_temp": 30},
    "Đậu khô & hạt khô": {"storage_days": (120, 270), "min_temp": 15, "max_temp": 28},
    "Thực phẩm khô": {"storage_days": (90, 180), "min_temp": 15, "max_temp": 30},
    "Nông sản sấy khô": {"storage_days": (120, 240), "min_temp": 15, "max_temp": 28},
    "Gia vị": {"storage_days": (180, 365), "min_temp": 15, "max_temp": 30},
    "Mật ong & sản phẩm từ ong": {"storage_days": (365, 730), "min_temp": 18, "max_temp": 28},
    "Trứng gia cầm": {"storage_days": (14, 21), "min_temp": 2, "max_temp": 6},
    "Sữa & sản phẩm từ sữa nông trại": {"storage_days": (5, 14), "min_temp": 2, "max_temp": 6},
    "Thực phẩm lên men & muối chua": {"storage_days": (30, 90), "min_temp": 4, "max_temp": 12},
    "Hoa & cây giống nông nghiệp": {"storage_days": (3, 7), "min_temp": 8, "max_temp": 18},
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


def build_dealer_description(supplier_product, retail_price: Decimal) -> str:
    return (
        f"{supplier_product.name} — bán lẻ tại cửa hàng. "
        f"Giá niêm yết {retail_price:,.0f} đ/{supplier_product.unit}. "
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
    retail_price: Decimal,
    force_near_expiry: bool = False,
) -> list[DealerInventoryBatch]:
    """Tạo 2–3 lô: tươi, sắp hết hạn (tuỳ chọn), và lô cũ còn hàng."""
    today = timezone.localdate()
    sp = supplier_product
    batches: list[DealerInventoryBatch] = []
    storage_days = sp.storage_duration_days or 7

    # Lô chính — nhập gần đây
    import_fresh = today - timedelta(days=random.randint(1, 5))
    prod_fresh, exp_fresh = _batch_dates_for_fresh_import(sp, import_fresh)
    qty_fresh = random.randint(80, 150)
    batches.append(
        DealerInventoryBatch.objects.create(
            dealer_product=dealer_product,
            batch_number=f"BATCH-F-{random.randint(1000, 9999)}",
            quantity=qty_fresh,
            remaining_quantity=random.randint(40, qty_fresh),
            import_price=sp.wholesale_price,
            import_date=import_fresh,
            production_date=prod_fresh,
            expiry_date=exp_fresh,
            status=DealerInventoryBatchStatus.ACTIVE,
        )
    )

    # Lô sắp hết hạn — ~30% SP hoặc bắt buộc cho demo age discount
    if force_near_expiry or random.random() < 0.35:
        days_left = random.randint(2, 4)
        exp_near = today + timedelta(days=days_left)
        prod_near = exp_near - timedelta(days=storage_days)
        import_near = prod_near + timedelta(days=min(2, max(0, storage_days - days_left - 1)))
        qty_near = random.randint(15, 40)
        manual_price = None
        if random.random() < 0.2:
            manual_price = (retail_price * Decimal("0.85")).quantize(Decimal("1"))
        batches.append(
            DealerInventoryBatch.objects.create(
                dealer_product=dealer_product,
                batch_number=f"BATCH-N-{random.randint(1000, 9999)}",
                quantity=qty_near,
                remaining_quantity=random.randint(5, qty_near),
                import_price=sp.wholesale_price,
                import_date=import_near,
                production_date=prod_near,
                expiry_date=exp_near,
                manual_sale_price=manual_price,
                status=DealerInventoryBatchStatus.ACTIVE,
            )
        )

    # Lô nhập sớm hơn — HSD còn xa
    if random.random() < 0.5:
        import_old = today - timedelta(days=random.randint(8, 20))
        prod_old, exp_old = _batch_dates_for_fresh_import(sp, import_old)
        if exp_old and exp_old > today + timedelta(days=7):
            qty_old = random.randint(30, 60)
            batches.append(
                DealerInventoryBatch.objects.create(
                    dealer_product=dealer_product,
                    batch_number=f"BATCH-O-{random.randint(1000, 9999)}",
                    quantity=qty_old,
                    remaining_quantity=random.randint(10, qty_old),
                    import_price=sp.wholesale_price,
                    import_date=import_old,
                    production_date=prod_old,
                    expiry_date=exp_old,
                    status=DealerInventoryBatchStatus.ACTIVE,
                )
            )

    return batches


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
            "discount_value": Decimal("15"),
            "priority": 10,
            "is_active": True,
            "daily_start_time": time(7, 0),
            "daily_end_time": time(10, 0),
        },
    )

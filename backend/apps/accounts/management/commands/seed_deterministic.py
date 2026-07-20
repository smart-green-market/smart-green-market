"""Hằng số và hàm deterministic cho seed — cùng dữ liệu mỗi lần chạy."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone as dt_timezone

from .seed_dealer_customer_tiers import DEALER_BUYER_COUNTS, resolve_buyer_tier

# random.seed / Faker.seed trong seed_data.handle
SEED_RANDOM_SEED = 42
SEED_FAKER_SEED = 20260720

SEED_HISTORY_ANCHOR = datetime(2025, 6, 15, 8, 30, 0, tzinfo=dt_timezone.utc)

SEED_DEALER_SLUGS = [
    "sd1-d01-fix",
    "sd2-d02-fix",
    "sd3-d03-fix",
]

SEED_SUPPLIER_COMPANIES = [
    "Hợp tác xã Nông nghiệp Xanh Đà Lạt",
    "Công ty TNHH Nông sản Việt Tươi",
    "Hợp tác xã Rau sạch Củ Chi",
    "Công ty Cổ phần Nông nghiệp Mekong Green",
    "Trang trại Hữu cơ An Phú",
]

SEED_DEALER_STORE_NAMES = [
    "Cửa hàng Nông sản Minh Tâm",
    "Siêu thị Rau sạch An Nhiên",
    "Thực phẩm Xanh Gia Phúc",
]

SEED_BUYER_FULL_NAMES = [
    "Nguyễn Minh Anh",
    "Trần Quốc Bảo",
    "Lê Hoàng Nam",
    "Phạm Thùy Linh",
    "Võ Ngọc Hân",
    "Đặng Tuấn Kiệt",
    "Bùi Thanh Trúc",
    "Nguyễn Đức Huy",
    "Trần Khánh Vy",
    "Lê Nhật Minh",
    "Phan Gia Hân",
    "Hồ Quang Vinh",
    "Đỗ Mỹ Duyên",
    "Nguyễn Thành Đạt",
    "Trương Bảo Ngọc",
    "Võ Minh Khang",
    "Lý Thanh Thảo",
    "Phạm Quốc Khánh",
    "Nguyễn Ngọc Mai",
    "Trần Anh Tuấn",
    "Lê Thu Trang",
    "Đặng Hoàng Phúc",
    "Bùi Kim Ngân",
    "Nguyễn Gia Bảo",
    "Phan Thanh Hương",
    "Hồ Minh Quân",
    "Đỗ Hải Yến",
    "Trương Quốc Việt",
    "Võ Thảo Nhi",
    "Lê Thành Công",
]


def global_buyer_index(dealer_index: int, slot: int) -> int:
    offset = 0
    for d in range(dealer_index):
        if d < len(DEALER_BUYER_COUNTS):
            offset += DEALER_BUYER_COUNTS[d]
    return offset + slot


def seed_buyer_email(dealer_index: int, slot: int, *, demo_email: str) -> str:
    if dealer_index == 0 and slot == 0:
        return demo_email
    return f"buyer.d{dealer_index + 1:02d}.kh{slot + 1:03d}@seed.example.com"


def seed_buyer_full_name(dealer_index: int, slot: int, *, demo_name: str) -> str:
    if dealer_index == 0 and slot == 0:
        return demo_name
    idx = global_buyer_index(dealer_index, slot)
    return SEED_BUYER_FULL_NAMES[idx % len(SEED_BUYER_FULL_NAMES)]


def seed_phone(dealer_index: int, slot: int) -> str:
    n = dealer_index * 1000 + slot + 1
    return f"090{ n:07d}"[:11]


def deterministic_order_count(dealer_index: int, slot: int) -> int:
    tier = resolve_buyer_tier(dealer_index, slot)
    if tier.kind == "passive" or not tier.order_count_range:
        return 0
    lo, hi = tier.order_count_range
    return lo + (dealer_index * 97 + slot * 13) % (hi - lo + 1)


def deterministic_order_amount(
    dealer_index: int,
    slot: int,
    order_index: int,
    amount_range: tuple[int, int],
) -> int:
    lo, hi = amount_range
    step = 50_000
    steps = max(1, (hi - lo) // step)
    pick = (dealer_index * 31 + slot * 7 + order_index * 11) % (steps + 1)
    value = lo + pick * step
    return min(hi, max(lo, value))


def deterministic_order_code(dealer_index: int, slot: int, order_index: int) -> str:
    return f"ORD-D{dealer_index + 1:02d}K{slot + 1:03d}N{order_index + 1:02d}"


def deterministic_order_created_at(
    dealer_index: int,
    slot: int,
    order_index: int,
) -> datetime:
    day_offset = 10 + dealer_index * 40 + slot * 2 + order_index * 5
    hour = 8 + (slot + order_index) % 10
    return SEED_HISTORY_ANCHOR - timedelta(days=day_offset, hours=-hour)


def deterministic_cthd_count(dealer_index: int, slot: int, order_index: int) -> int:
    """Số dòng CTHD trên đơn — luôn 1 với seed hiện tại."""
    return 1

"""Hạng thành viên mặc định và seed theo từng đại lý."""

DEFAULT_LOYALTY_TIERS = [
    {
        "code": "MEMBER",
        "name": "Thành viên",
        "level": 1,
        "min_points": 0,
        "description": "Hạng cơ bản khi tham gia chương trình khách hàng thân thiết.",
        "benefits": ["Tích điểm cơ bản"],
    },
    {
        "code": "SILVER",
        "name": "Bạc",
        "level": 2,
        "min_points": 500,
        "description": "Khách hàng đã tích lũy điểm ổn định.",
        "benefits": ["Voucher chào hạng", "Ưu đãi 3%"],
    },
    {
        "code": "GOLD",
        "name": "Vàng",
        "level": 3,
        "min_points": 1000,
        "description": "Khách hàng trung thành với chi tiêu tích cực.",
        "benefits": ["Ưu đãi 5%", "Voucher sinh nhật"],
    },
    {
        "code": "DIAMOND",
        "name": "Kim cương",
        "level": 4,
        "min_points": 2000,
        "description": "Hạng cao nhất dành cho khách hàng giá trị.",
        "benefits": [
            "Ưu đãi 10%",
            "Voucher riêng",
            "Ưu tiên chương trình đặc biệt",
        ],
    },
]

DEFAULT_POINTS_PER_UNIT = 10_000


def seed_default_loyalty_for_dealer(dealer, *, apps=None):
    """Tạo cấu hình và bốn hạng mặc định cho một đại lý (idempotent)."""
    if apps is not None:
        DealerLoyaltySettings = apps.get_model("loyalty", "DealerLoyaltySettings")
        LoyaltyTier = apps.get_model("loyalty", "LoyaltyTier")
    else:
        from .models import DealerLoyaltySettings, LoyaltyTier

    DealerLoyaltySettings.objects.get_or_create(
        dealer=dealer,
        defaults={"points_per_unit": DEFAULT_POINTS_PER_UNIT},
    )

    for row in DEFAULT_LOYALTY_TIERS:
        LoyaltyTier.objects.update_or_create(
            dealer=dealer,
            code=row["code"],
            defaults={
                "name": row["name"],
                "level": row["level"],
                "min_points": row["min_points"],
                "description": row["description"],
                "benefits": row["benefits"],
                "is_active": True,
                "is_system": True,
            },
        )


def seed_all_dealers_loyalty(*, apps=None):
    """Backfill hạng mặc định cho mọi đại lý hiện có."""
    if apps is not None:
        DealerProfile = apps.get_model("dealers", "DealerProfile")
    else:
        from apps.dealers.models import DealerProfile

    for dealer in DealerProfile.objects.all().order_by("id"):
        seed_default_loyalty_for_dealer(dealer, apps=apps)


def get_base_tier_for_dealer(dealer, *, apps=None):
    """Hạng thấp nhất đang active của đại lý."""
    if apps is not None:
        LoyaltyTier = apps.get_model("loyalty", "LoyaltyTier")
    else:
        from .models import LoyaltyTier

    return (
        LoyaltyTier.objects.filter(dealer=dealer, is_active=True)
        .order_by("level", "min_points", "id")
        .first()
    )

"""Segment khách hàng hệ thống — dùng cho seed/migration và gán mặc định."""

from django.utils import timezone

DEFAULT_CUSTOMER_SEGMENT_CODE = "PASSIVE"

SYSTEM_CUSTOMER_SEGMENTS = [
    {
        "code": "CHURN_RISK",
        "name": "Khách hàng Có nguy cơ rời bỏ",
        "description": (
            "Khách hàng hoạt động ít hoặc không còn hoạt động, có nguy cơ rời bỏ"
        ),
    },
    {
        "code": "PASSIVE",
        "name": "Khách hàng Thụ động",
        "description": "Khách hàng bình thường hoặc khách vãng lai",
    },
    {
        "code": "POTENTIAL",
        "name": "Khách hàng Tiềm năng",
        "description": "Khách hàng hoạt động năng nổ, có tiềm năng trở thành VIP",
    },
    {
        "code": "VIP",
        "name": "Khách hàng VIP",
        "description": (
            "Khách hàng đóng vai trò quan trọng, là khách hàng trọng điểm của hệ thống"
        ),
    },
]


def seed_system_customer_segments(*, apps=None, seeded_at=None):
    """Tạo/cập nhật segment hệ thống (idempotent)."""
    if apps is not None:
        CustomerSegment = apps.get_model("marketing", "CustomerSegment")
    else:
        from .models import CustomerSegment

    timestamp = seeded_at or timezone.now()
    for row in SYSTEM_CUSTOMER_SEGMENTS:
        segment, created = CustomerSegment.objects.update_or_create(
            code=row["code"],
            defaults={
                "name": row["name"],
                "description": row["description"],
                "is_system": True,
            },
        )
        if created:
            CustomerSegment.objects.filter(pk=segment.pk).update(
                created_at=timestamp,
                updated_at=timestamp,
            )

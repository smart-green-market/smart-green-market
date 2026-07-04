"""Múi giờ nghiệp vụ — Django TIME_ZONE vẫn UTC."""

from datetime import datetime
from zoneinfo import ZoneInfo

from django.utils import timezone

# Giờ Việt Nam (+07) cho khung giờ daily schedule, giao hàng, v.v.
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def vn_localtime(at=None) -> datetime:
    """Chuyển datetime aware sang giờ Việt Nam."""
    at = at or timezone.now()
    return at.astimezone(VN_TZ)


def vn_current_time(at=None):
    """Lấy phần time() theo giờ Việt Nam."""
    return vn_localtime(at).time()

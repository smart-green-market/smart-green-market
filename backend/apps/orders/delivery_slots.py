"""Khung giờ giao hàng B2C rau — backend là nguồn xác thực duy nhất."""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, ValidationError

from apps.system_config.services import get_system_settings

# Giờ nghiệp vụ VN (+07) — không đổi TIME_ZONE Django (UTC).
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")

INVALID_DELIVERY_SLOT_MSG = "Khung giờ giao hàng không còn khả dụng."

# Default khi chưa load SystemSettings (tests / docs).
MAX_BOOKING_DAYS = 2

# YC đặt trước: cửa sổ ngày giao dài hơn checkout (chờ hàng về kho).
MAX_PREORDER_BOOKING_DAYS = 120
INVALID_PREORDER_DELIVERY_SLOT_MSG = (
    f"Ngày giao phải từ hôm nay đến tối đa {MAX_PREORDER_BOOKING_DAYS} ngày."
)


@dataclass(frozen=True)
class DeliverySlotDef:
    id: str
    name: str
    start: time
    end: time


DELIVERY_SLOT_DEFINITIONS = (
    DeliverySlotDef("morning", "Sáng", time(7, 0), time(9, 0)),
    DeliverySlotDef("afternoon", "Chiều", time(16, 0), time(19, 0)),
)

SLOT_BY_ID = {slot.id: slot for slot in DELIVERY_SLOT_DEFINITIONS}


def get_delivery_slot_config():
    """Cấu hình slot — expose qua system-config / API."""
    s = get_system_settings()
    return {
        "timezone": "Asia/Ho_Chi_Minh",
        "min_lead_hours": s.min_lead_hours,
        "morning_cutoff_hour": s.morning_cutoff_hour,
        "max_booking_days": s.max_booking_days,
        "slots": [
            {
                "id": slot.id,
                "name": slot.name,
                "start_time": slot.start.strftime("%H:%M"),
                "end_time": slot.end.strftime("%H:%M"),
            }
            for slot in DELIVERY_SLOT_DEFINITIONS
        ],
    }


def _now_vn(now=None):
    return (now or timezone.now()).astimezone(VN_TZ)


def slot_start_datetime(delivery_date: date, slot: DeliverySlotDef) -> datetime:
    return datetime.combine(delivery_date, slot.start, tzinfo=VN_TZ)


def _booking_window(now=None):
    """Cửa sổ đặt: max_booking_days ngày lịch (hôm nay + N-1 ngày)."""
    max_days = get_system_settings().max_booking_days
    today = _now_vn(now).date()
    return today, today + timedelta(days=max_days - 1)


def is_slot_available(delivery_date: date, slot_id: str, *, now=None) -> bool:
    """Một slot khả dụng khi thỏa lead time, cut-off sáng mai, chưa qua, trong cửa sổ đặt."""
    slot = SLOT_BY_ID.get(slot_id)
    if slot is None:
        return False

    s = get_system_settings()
    now_aware = now or timezone.now()
    now_vn = now_aware.astimezone(VN_TZ)
    slot_start = slot_start_datetime(delivery_date, slot)

    earliest_date, latest_date = _booking_window(now_aware)
    if delivery_date < earliest_date or delivery_date > latest_date:
        return False

    if slot_start <= now_aware:
        return False

    if slot_start < now_aware + timedelta(hours=s.min_lead_hours):
        return False

    tomorrow_vn = now_vn.date() + timedelta(days=1)
    if (
        delivery_date == tomorrow_vn
        and slot_id == "morning"
        and now_vn.hour >= s.morning_cutoff_hour
    ):
        return False

    return True


def resolve_delivery_time(delivery_date: date, slot_id: str, *, now=None) -> datetime:
    """Trả datetime delivery_time từ date + slot; raise nếu không hợp lệ."""
    if slot_id not in SLOT_BY_ID:
        raise ValidationError(
            {
                "delivery_slot": ErrorDetail(
                    "Khung giờ không hợp lệ.",
                    code="invalid_delivery_slot",
                )
            }
        )
    if not is_slot_available(delivery_date, slot_id, now=now):
        raise ValidationError(
            {
                "delivery_slot": ErrorDetail(
                    INVALID_DELIVERY_SLOT_MSG,
                    code="invalid_delivery_slot",
                )
            }
        )
    return slot_start_datetime(delivery_date, SLOT_BY_ID[slot_id])


def _preorder_booking_window(now=None):
    """Cửa sổ ngày giao cho YC đặt trước — không áp lead time / cutoff checkout."""
    today = _now_vn(now).date()
    return today, today + timedelta(days=MAX_PREORDER_BOOKING_DAYS - 1)


def is_preorder_slot_valid(delivery_date: date, slot_id: str, *, now=None) -> bool:
    """Slot hợp lệ cho đặt trước: đúng khung giờ, trong cửa sổ, chưa qua."""
    slot = SLOT_BY_ID.get(slot_id)
    if slot is None:
        return False

    now_aware = now or timezone.now()
    earliest_date, latest_date = _preorder_booking_window(now_aware)
    if delivery_date < earliest_date or delivery_date > latest_date:
        return False

    slot_start = slot_start_datetime(delivery_date, slot)
    return slot_start > now_aware


def resolve_preorder_delivery_time(
    delivery_date: date, slot_id: str, *, now=None
) -> datetime:
    """Trả delivery_time cho YC đặt trước — cửa sổ ngày rộng hơn checkout."""
    if slot_id not in SLOT_BY_ID:
        raise ValidationError(
            {
                "delivery_slot": ErrorDetail(
                    "Khung giờ không hợp lệ.",
                    code="invalid_delivery_slot",
                )
            }
        )
    if not is_preorder_slot_valid(delivery_date, slot_id, now=now):
        raise ValidationError(
            {
                "delivery_slot": ErrorDetail(
                    INVALID_PREORDER_DELIVERY_SLOT_MSG,
                    code="invalid_delivery_slot",
                )
            }
        )
    return slot_start_datetime(delivery_date, SLOT_BY_ID[slot_id])


def validate_preorder_delivery_datetime(delivery_time: datetime, *, now=None) -> None:
    """Validate delivery_time cho luồng đặt trước."""
    if timezone.is_naive(delivery_time):
        raise ValidationError(
            {
                "delivery_time": ErrorDetail(
                    INVALID_PREORDER_DELIVERY_SLOT_MSG,
                    code="invalid_delivery_slot",
                )
            }
        )

    dt_vn = delivery_time.astimezone(VN_TZ)
    delivery_date = dt_vn.date()
    slot_time = dt_vn.time().replace(second=0, microsecond=0)

    matched = None
    for slot in DELIVERY_SLOT_DEFINITIONS:
        if slot.start == slot_time:
            matched = slot
            break

    if matched is None or not is_preorder_slot_valid(
        delivery_date, matched.id, now=now
    ):
        raise ValidationError(
            {
                "delivery_time": ErrorDetail(
                    INVALID_PREORDER_DELIVERY_SLOT_MSG,
                    code="invalid_delivery_slot",
                )
            }
        )


def get_preorder_delivery_date_bounds(*, now=None) -> dict:
    """Min/max date (ISO) cho FE dealer/buyer chọn ngày giao đặt trước."""
    earliest_date, latest_date = _preorder_booking_window(now)
    return {
        "min_date": earliest_date.isoformat(),
        "max_date": latest_date.isoformat(),
        "max_preorder_booking_days": MAX_PREORDER_BOOKING_DAYS,
    }


def validate_delivery_datetime(delivery_time: datetime, *, now=None) -> None:
    """Validate delivery_time khớp đúng slot start và còn available."""
    if timezone.is_naive(delivery_time):
        raise ValidationError(
            {
                "delivery_time": ErrorDetail(
                    INVALID_DELIVERY_SLOT_MSG,
                    code="invalid_delivery_slot",
                )
            }
        )

    dt_vn = delivery_time.astimezone(VN_TZ)
    delivery_date = dt_vn.date()
    slot_time = dt_vn.time().replace(second=0, microsecond=0)

    matched = None
    for slot in DELIVERY_SLOT_DEFINITIONS:
        if slot.start == slot_time:
            matched = slot
            break

    if matched is None or not is_slot_available(delivery_date, matched.id, now=now):
        raise ValidationError(
            {
                "delivery_time": ErrorDetail(
                    INVALID_DELIVERY_SLOT_MSG,
                    code="invalid_delivery_slot",
                )
            }
        )


def parse_delivery_slot(delivery_time: datetime) -> dict | None:
    """Suy ra date + slot từ delivery_time đã lưu; None nếu không khớp slot chuẩn."""
    if delivery_time is None or timezone.is_naive(delivery_time):
        return None

    dt_vn = delivery_time.astimezone(VN_TZ)
    slot_time = dt_vn.time().replace(second=0, microsecond=0)
    for slot in DELIVERY_SLOT_DEFINITIONS:
        if slot.start == slot_time:
            return {
                "delivery_date": dt_vn.date().isoformat(),
                "delivery_slot": slot.id,
                "delivery_slot_name": slot.name,
                "delivery_slot_start_time": slot.start.strftime("%H:%M"),
                "delivery_slot_end_time": slot.end.strftime("%H:%M"),
            }
    return None


def get_available_delivery_slots(*, now=None):
    """Danh sách ngày + slot kèm cờ available (FE chỉ hiển thị, không tự tính)."""
    now_aware = now or timezone.now()
    now_vn = _now_vn(now_aware)
    earliest_date, latest_date = _booking_window(now_aware)

    dates_payload = []
    d = earliest_date
    while d <= latest_date:
        slots_payload = []
        for slot in DELIVERY_SLOT_DEFINITIONS:
            available = is_slot_available(d, slot.id, now=now_aware)
            slot_start = slot_start_datetime(d, slot)
            slots_payload.append(
                {
                    "id": slot.id,
                    "name": slot.name,
                    "start_time": slot.start.strftime("%H:%M"),
                    "end_time": slot.end.strftime("%H:%M"),
                    "available": available,
                    "delivery_time": slot_start.isoformat() if available else None,
                }
            )
        dates_payload.append({"date": d.isoformat(), "slots": slots_payload})
        d += timedelta(days=1)

    return {
        **get_delivery_slot_config(),
        "generated_at": now_vn.isoformat(),
        "dates": dates_payload,
    }

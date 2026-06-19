"""Unit tests khung giờ giao rau B2C."""

from datetime import date, datetime

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from apps.orders.delivery_slots import (
    MAX_BOOKING_DAYS,
    VN_TZ,
    get_available_delivery_slots,
    is_slot_available,
    parse_delivery_slot,
    resolve_delivery_time,
    validate_delivery_datetime,
)

VN = VN_TZ


def _vn_dt(year, month, day, hour, minute=0):
    return datetime(year, month, day, hour, minute, tzinfo=VN)


class DeliverySlotLeadTimeTests(SimpleTestCase):
    def test_afternoon_available_with_8h_lead(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        d = date(2026, 6, 21)
        self.assertTrue(is_slot_available(d, "afternoon", now=now))

    def test_afternoon_unavailable_with_4h_lead(self):
        now = _vn_dt(2026, 6, 21, 12, 0)
        d = date(2026, 6, 21)
        self.assertFalse(is_slot_available(d, "afternoon", now=now))


class DeliverySlotMorningCutoffTests(SimpleTestCase):
    def test_morning_tomorrow_available_before_cutoff(self):
        now = _vn_dt(2026, 6, 21, 22, 30)
        tomorrow = date(2026, 6, 22)
        self.assertTrue(is_slot_available(tomorrow, "morning", now=now))

    def test_morning_tomorrow_unavailable_at_cutoff(self):
        now = _vn_dt(2026, 6, 21, 23, 0)
        tomorrow = date(2026, 6, 22)
        self.assertFalse(is_slot_available(tomorrow, "morning", now=now))


class DeliverySlotPastTests(SimpleTestCase):
    def test_morning_today_unavailable_after_start(self):
        now = _vn_dt(2026, 6, 21, 8, 30)
        today = date(2026, 6, 21)
        self.assertFalse(is_slot_available(today, "morning", now=now))


class DeliverySlotBookingWindowTests(SimpleTestCase):
    def test_tomorrow_within_window(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        self.assertTrue(is_slot_available(date(2026, 6, 22), "morning", now=now))

    def test_day_after_tomorrow_outside_window(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        self.assertFalse(is_slot_available(date(2026, 6, 23), "morning", now=now))

    def test_beyond_two_days(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        self.assertFalse(is_slot_available(date(2026, 6, 24), "morning", now=now))

    def test_api_returns_two_calendar_days(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        payload = get_available_delivery_slots(now=now)
        self.assertEqual(len(payload["dates"]), MAX_BOOKING_DAYS)
        self.assertEqual(payload["max_booking_days"], MAX_BOOKING_DAYS)
        self.assertEqual(payload["dates"][0]["date"], "2026-06-21")
        self.assertEqual(payload["dates"][1]["date"], "2026-06-22")


class DeliverySlotResolveTests(SimpleTestCase):
    def test_resolve_morning_delivery_time(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        dt = resolve_delivery_time(date(2026, 6, 22), "morning", now=now)
        self.assertEqual(dt, _vn_dt(2026, 6, 22, 7, 0))

    def test_resolve_invalid_raises(self):
        now = _vn_dt(2026, 6, 21, 12, 0)
        with self.assertRaises(ValidationError):
            resolve_delivery_time(date(2026, 6, 21), "afternoon", now=now)


class DeliverySlotValidateDatetimeTests(SimpleTestCase):
    def test_valid_delivery_time(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        dt = _vn_dt(2026, 6, 22, 7, 0)
        validate_delivery_datetime(dt, now=now)

    def test_invalid_hour_raises(self):
        now = _vn_dt(2026, 6, 21, 8, 0)
        dt = _vn_dt(2026, 6, 22, 8, 30)
        with self.assertRaises(ValidationError):
            validate_delivery_datetime(dt, now=now)


class ParseDeliverySlotTests(SimpleTestCase):
    def test_morning_slot(self):
        dt = _vn_dt(2026, 6, 22, 7, 0)
        info = parse_delivery_slot(dt)
        self.assertEqual(info["delivery_date"], "2026-06-22")
        self.assertEqual(info["delivery_slot"], "morning")
        self.assertEqual(info["delivery_slot_name"], "Sáng")

    def test_afternoon_slot(self):
        dt = _vn_dt(2026, 6, 22, 16, 0)
        info = parse_delivery_slot(dt)
        self.assertEqual(info["delivery_slot"], "afternoon")

    def test_invalid_time_returns_none(self):
        self.assertIsNone(parse_delivery_slot(_vn_dt(2026, 6, 22, 8, 30)))

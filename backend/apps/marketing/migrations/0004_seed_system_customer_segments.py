from datetime import datetime
from zoneinfo import ZoneInfo

from django.db import migrations


def seed_segments(apps, schema_editor):
    from apps.marketing.segment_defaults import seed_system_customer_segments

    seeded_at = datetime(2026, 7, 1, 10, 30, 0, tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
    seed_system_customer_segments(apps=apps, seeded_at=seeded_at)


class Migration(migrations.Migration):

    dependencies = [
        ("marketing", "0003_remove_customer_segment_dealer"),
    ]

    operations = [
        migrations.RunPython(seed_segments, migrations.RunPython.noop),
    ]

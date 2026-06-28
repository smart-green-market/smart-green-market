from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("system_config", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="systemsettings",
            name="max_delivery_delay_days",
            field=models.PositiveSmallIntegerField(
                default=7,
                help_text="NCC cam kết giao muộn nhất = requested + N ngày (khi confirm PO).",
            ),
        ),
    ]

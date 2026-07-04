from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("promotions", "0007_customer_saved_voucher"),
    ]

    operations = [
        migrations.AddField(
            model_name="promotion",
            name="schedule_type",
            field=models.CharField(
                choices=[
                    ("date_range", "Theo khoảng ngày"),
                    ("daily_time", "Lặp hằng ngày theo khung giờ"),
                ],
                default="date_range",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="promotion",
            name="daily_start_time",
            field=models.TimeField(
                blank=True,
                help_text="Giờ bắt đầu mỗi ngày khi schedule_type=daily_time",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="promotion",
            name="daily_end_time",
            field=models.TimeField(
                blank=True,
                help_text="Giờ kết thúc mỗi ngày khi schedule_type=daily_time",
                null=True,
            ),
        ),
    ]

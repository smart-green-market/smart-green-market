from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dealer_products", "0011_simplify_age_discount_policy"),
    ]

    operations = [
        migrations.AddField(
            model_name="agediscountpolicy",
            name="daily_start_time",
            field=models.TimeField(
                blank=True,
                help_text="Giờ bắt đầu áp dụng mỗi ngày",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="agediscountpolicy",
            name="daily_end_time",
            field=models.TimeField(
                blank=True,
                help_text="Giờ kết thúc áp dụng mỗi ngày",
                null=True,
            ),
        ),
    ]

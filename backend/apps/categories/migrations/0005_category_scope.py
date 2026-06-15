# Generated manually for category scope (system vs custom)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0004_alter_category_options_category_sort_order_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="scope",
            field=models.CharField(
                choices=[("system", "Hệ thống"), ("custom", "Riêng")],
                default="custom",
                max_length=20,
            ),
        ),
    ]

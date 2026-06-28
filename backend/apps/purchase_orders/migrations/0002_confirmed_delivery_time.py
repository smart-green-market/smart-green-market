from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("purchase_orders", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="purchaseorder",
            name="confirmed_delivery_time",
            field=models.DateTimeField(
                blank=True,
                help_text="Thời gian giao NCC cam kết — chốt khi confirm.",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="purchaseorder",
            name="requested_delivery_time",
            field=models.DateTimeField(
                help_text="Thời gian giao mong muốn của đại lý (tham khảo cho NCC).",
            ),
        ),
    ]

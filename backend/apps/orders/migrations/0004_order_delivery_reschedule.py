from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0003_preorder_waiting_stock"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="proposed_delivery_time",
            field=models.DateTimeField(
                blank=True,
                help_text="Ngày giao đại lý đề xuất khi trễ hàng (waiting_stock)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="reschedule_reason",
            field=models.TextField(
                blank=True,
                help_text="Lý do đại lý đề xuất đổi ngày giao",
            ),
        ),
    ]

from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("purchase_orders", "0005_purchaseorderitem_quantity_discount_snapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="purchaseorder",
            name="credit_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Số tiền NCC cần hoàn lại khi đại lý đã trả thừa sau trả hàng",
                max_digits=14,
            ),
        ),
    ]

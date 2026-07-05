from decimal import Decimal

from django.db import migrations, models


def backfill_base_unit_price(apps, schema_editor):
    PurchaseOrderItem = apps.get_model("purchase_orders", "PurchaseOrderItem")
    for item in PurchaseOrderItem.objects.filter(base_unit_price__isnull=True):
        item.base_unit_price = item.unit_price
        item.save(update_fields=["base_unit_price"])


class Migration(migrations.Migration):

    dependencies = [
        ("purchase_orders", "0004_item_review_and_pending_dealer_confirmation"),
    ]

    operations = [
        migrations.AddField(
            model_name="purchaseorderitem",
            name="base_unit_price",
            field=models.DecimalField(
                decimal_places=2,
                help_text="Giá sỉ gốc tại thời điểm đặt (snapshot).",
                max_digits=12,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="purchaseorderitem",
            name="discount_type",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Loại giảm theo SL: percent | fixed (rỗng nếu không giảm).",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="purchaseorderitem",
            name="discount_value",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Giá trị giảm (% hoặc VND) của bậc đã áp dụng.",
                max_digits=12,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="purchaseorderitem",
            name="discount_min_quantity",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Ngưỡng số lượng tối thiểu của bậc giảm đã áp dụng.",
                max_digits=12,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="purchaseorderitem",
            name="line_discount_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Tổng tiền giảm của dòng = (base - unit_price) × quantity.",
                max_digits=14,
            ),
        ),
        migrations.RunPython(backfill_base_unit_price, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="purchaseorderitem",
            name="base_unit_price",
            field=models.DecimalField(
                decimal_places=2,
                help_text="Giá sỉ gốc tại thời điểm đặt (snapshot).",
                max_digits=12,
            ),
        ),
    ]

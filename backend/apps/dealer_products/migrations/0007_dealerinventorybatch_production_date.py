"""Thêm production_date trên lô tồn kho và backfill từ dữ liệu hiện có."""

from datetime import timedelta

from django.db import migrations, models

MAX_STORAGE_DURATION_DAYS = 3650


def _normalize_storage_days(days):
    if days is None:
        return None
    try:
        days = int(days)
    except (TypeError, ValueError):
        return None
    if days <= 0 or days > MAX_STORAGE_DURATION_DAYS:
        return None
    return days


def backfill_production_dates(apps, schema_editor):
    Batch = apps.get_model("dealer_products", "DealerInventoryBatch")
    qs = Batch.objects.filter(production_date__isnull=True).select_related(
        "dealer_product__supplier_product"
    )
    for batch in qs.iterator():
        production_date = batch.import_date
        supplier_product = getattr(batch.dealer_product, "supplier_product", None)
        days = None
        if supplier_product is not None:
            days = _normalize_storage_days(supplier_product.storage_duration_days)
        if batch.expiry_date and days is not None:
            production_date = batch.expiry_date - timedelta(days=days)
        Batch.objects.filter(pk=batch.pk).update(production_date=production_date)


class Migration(migrations.Migration):

    dependencies = [
        ("dealer_products", "0006_age_discount"),
    ]

    operations = [
        migrations.AddField(
            model_name="dealerinventorybatch",
            name="production_date",
            field=models.DateField(
                blank=True,
                help_text=(
                    "Ngày sản xuất lô — mốc bắt đầu tính hạn theo storage_duration_days của SP NCC "
                    "(expiry_date − storage_duration_days tại thời điểm nhập kho)."
                ),
                null=True,
            ),
        ),
        migrations.RunPython(backfill_production_dates, migrations.RunPython.noop),
    ]

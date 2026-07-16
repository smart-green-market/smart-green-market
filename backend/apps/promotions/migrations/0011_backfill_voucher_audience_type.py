"""Backfill audience_type từ PromotionTarget legacy."""

from django.db import migrations


def backfill_audience_type(apps, schema_editor):
    Promotion = apps.get_model("promotions", "Promotion")
    PromotionTarget = apps.get_model("promotions", "PromotionTarget")

    SEGMENT = "segment"
    ALL = "all"
    AUDIENCE_ALL = "ALL"
    AUDIENCE_SEGMENT = "CUSTOMER_SEGMENT"

    abnormal_count = 0

    for promotion in Promotion.objects.all().iterator():
        targets = list(
            PromotionTarget.objects.filter(promotion_id=promotion.id).values_list(
                "target_type",
                flat=True,
            )
        )
        has_segment = SEGMENT in targets
        has_all = ALL in targets

        if has_segment and has_all:
            abnormal_count += 1
            promotion.audience_type = AUDIENCE_SEGMENT
        elif has_segment:
            promotion.audience_type = AUDIENCE_SEGMENT
        elif has_all:
            promotion.audience_type = AUDIENCE_ALL
        else:
            promotion.audience_type = AUDIENCE_ALL

        promotion.save(update_fields=["audience_type"])

    if abnormal_count:
        print(
            f"[backfill_voucher_audience_type] "
            f"{abnormal_count} promotion(s) had both segment and all targets; "
            f"set audience_type=CUSTOMER_SEGMENT."
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("promotions", "0010_promotion_voucher_audience"),
    ]

    operations = [
        migrations.RunPython(backfill_audience_type, noop_reverse),
    ]

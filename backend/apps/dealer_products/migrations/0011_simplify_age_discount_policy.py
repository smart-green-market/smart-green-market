from django.db import migrations, models


def copy_discount_from_top_tier(apps, schema_editor):
    AgeDiscountPolicy = apps.get_model("dealer_products", "AgeDiscountPolicy")
    AgeDiscountTier = apps.get_model("dealer_products", "AgeDiscountTier")

    for policy in AgeDiscountPolicy.objects.all():
        tier = (
            AgeDiscountTier.objects.filter(policy_id=policy.id)
            .order_by("-sort_order", "-id")
            .first()
        )
        if tier:
            policy.discount_type = tier.discount_type
            policy.discount_value = tier.discount_value
            policy.save(update_fields=["discount_type", "discount_value"])


class Migration(migrations.Migration):

    dependencies = [
        ("dealer_products", "0010_alter_dealerproductrelatedrecommendation_related_product_ids"),
    ]

    operations = [
        migrations.AddField(
            model_name="agediscountpolicy",
            name="discount_type",
            field=models.CharField(
                choices=[
                    ("percent", "Theo phần trăm"),
                    ("fixed", "Số tiền cố định"),
                ],
                default="percent",
                max_length=10,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="agediscountpolicy",
            name="discount_value",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=12,
            ),
            preserve_default=False,
        ),
        migrations.RunPython(copy_discount_from_top_tier, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="agediscountpolicy",
            name="threshold_type",
        ),
        migrations.DeleteModel(
            name="AgeDiscountTier",
        ),
    ]

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0001_initial"),
        ("promotions", "0006_alter_promotion_code"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomerSavedVoucher",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("saved_at", models.DateTimeField(auto_now_add=True)),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="saved_vouchers",
                        to="customers.customerprofile",
                    ),
                ),
                (
                    "promotion",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="saved_by_customers",
                        to="promotions.promotion",
                    ),
                ),
            ],
            options={
                "db_table": "customer_saved_vouchers",
                "ordering": ["-saved_at", "-id"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("customer", "promotion"),
                        name="unique_customer_saved_voucher",
                    )
                ],
            },
        ),
    ]

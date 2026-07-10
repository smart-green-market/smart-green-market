"""Gộp SP đại lý trùng tên, hợp nhất lô MAIN, ràng buộc unique tên/đại lý."""

from django.db import migrations, models
from django.db.models import Q
from django.db.models.functions import Lower


def forwards_merge_and_consolidate(apps, schema_editor):
    from apps.dealer_products.merge_duplicates import (
        consolidate_orphan_batches_for_dealer,
        merge_all_duplicate_dealer_products,
    )
    from apps.dealers.models import DealerProfile

    merge_all_duplicate_dealer_products()
    for dealer in DealerProfile.objects.all().order_by("id"):
        consolidate_orphan_batches_for_dealer(dealer)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("dealer_products", "0013_return_restore_transaction_type"),
    ]

    operations = [
        migrations.RunPython(forwards_merge_and_consolidate, backwards_noop),
        migrations.AddConstraint(
            model_name="dealerproduct",
            constraint=models.UniqueConstraint(
                "dealer_profile",
                Lower("title"),
                condition=Q(
                    status__in=["pending", "active", "inactive", "rejected"]
                ),
                name="unique_dealer_product_title_per_dealer",
            ),
        ),
    ]

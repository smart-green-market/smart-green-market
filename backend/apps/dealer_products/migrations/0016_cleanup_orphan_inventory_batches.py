"""Dọn lô tồn thuộc SP đã xóa và gộp lô cũ vào MAIN sau gộp catalog."""

from django.db import migrations


def forwards_cleanup(apps, schema_editor):
    from apps.dealer_products.merge_duplicates import (
        cleanup_batches_on_deleted_dealer_products,
        consolidate_orphan_batches_for_dealer,
        merge_all_duplicate_dealer_products,
    )
    from apps.dealers.models import DealerProfile

    cleanup_batches_on_deleted_dealer_products()
    merge_all_duplicate_dealer_products()
    for dealer in DealerProfile.objects.all().order_by("id"):
        consolidate_orphan_batches_for_dealer(dealer)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("dealer_products", "0015_dealerproduct_product_master"),
    ]

    operations = [
        migrations.RunPython(forwards_cleanup, backwards_noop),
    ]

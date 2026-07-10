"""Gộp SP đại lý theo product catalog + ràng buộc unique theo master."""

from django.db import migrations, models
from django.db.models import Q
from django.db.models.functions import Lower


def backfill_product_master(apps, schema_editor):
    DealerProduct = apps.get_model("dealer_products", "DealerProduct")
    for product in DealerProduct.objects.select_related("supplier_product").iterator():
        master_id = getattr(product.supplier_product, "product_master_id", None)
        if master_id and product.product_master_id != master_id:
            product.product_master_id = master_id
            product.save(update_fields=["product_master_id"])


def forwards_merge_by_catalog(apps, schema_editor):
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

    atomic = False

    dependencies = [
        ("dealer_products", "0014_canonical_product_single_batch"),
        ("product_catalog", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="dealerproduct",
            name="product_master",
            field=models.ForeignKey(
                blank=True,
                help_text="Catalog chuẩn — một SP bán lẻ / master / đại lý",
                null=True,
                on_delete=models.deletion.PROTECT,
                related_name="dealer_products",
                to="product_catalog.productmaster",
            ),
        ),
        migrations.RunPython(backfill_product_master, backwards_noop),
        migrations.RemoveConstraint(
            model_name="dealerproduct",
            name="unique_dealer_product_title_per_dealer",
        ),
        migrations.RunPython(forwards_merge_by_catalog, backwards_noop),
        migrations.AddConstraint(
            model_name="dealerproduct",
            constraint=models.UniqueConstraint(
                "dealer_profile",
                "product_master",
                condition=Q(
                    product_master__isnull=False,
                    status__in=["pending", "active", "inactive", "rejected"],
                ),
                name="unique_dealer_product_master_per_dealer",
            ),
        ),
        migrations.AddConstraint(
            model_name="dealerproduct",
            constraint=models.UniqueConstraint(
                Lower("title"),
                "dealer_profile",
                condition=Q(
                    product_master__isnull=True,
                    status__in=["pending", "active", "inactive", "rejected"],
                ),
                name="unique_dealer_product_title_per_dealer_no_master",
            ),
        ),
    ]

"""Gộp SP đại lý theo product catalog + ràng buộc unique theo master."""

from django.db import migrations, models
from django.db.models import Q
from django.db.models.functions import Lower


def _table_columns(schema_editor, table_name):
    with schema_editor.connection.cursor() as cursor:
        return {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }


def _table_constraints(schema_editor, table_name):
    with schema_editor.connection.cursor() as cursor:
        return schema_editor.connection.introspection.get_constraints(cursor, table_name)


def add_product_master_column_if_missing(apps, schema_editor):
    if "product_master_id" in _table_columns(schema_editor, "dealer_products"):
        return
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            """
            ALTER TABLE dealer_products
            ADD COLUMN IF NOT EXISTS product_master_id BIGINT NULL
            REFERENCES product_masters(id) DEFERRABLE INITIALLY DEFERRED
            """
        )


def backfill_product_master(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            """
            UPDATE dealer_products AS dp
            SET product_master_id = sp.product_master_id
            FROM supplier_products AS sp
            WHERE dp.supplier_product_id = sp.id
              AND sp.product_master_id IS NOT NULL
              AND dp.product_master_id IS DISTINCT FROM sp.product_master_id
            """
        )


def remove_title_unique_constraint_if_exists(apps, schema_editor):
    constraints = _table_constraints(schema_editor, "dealer_products")
    if "unique_dealer_product_title_per_dealer" not in constraints:
        return
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            'ALTER TABLE dealer_products DROP CONSTRAINT IF EXISTS "unique_dealer_product_title_per_dealer"'
        )


def forwards_merge_by_catalog(apps, schema_editor):
    from django.db import transaction

    from apps.dealer_products.merge_duplicates import (
        consolidate_orphan_batches_for_dealer,
        merge_all_duplicate_dealer_products,
    )
    from apps.dealers.models import DealerProfile

    with transaction.atomic():
        merge_all_duplicate_dealer_products()
    for dealer in DealerProfile.objects.all().order_by("id"):
        with transaction.atomic():
            consolidate_orphan_batches_for_dealer(dealer)


def add_master_constraints_if_missing(apps, schema_editor):
    DealerProduct = apps.get_model("dealer_products", "DealerProduct")
    constraints = _table_constraints(schema_editor, "dealer_products")

    if "unique_dealer_product_master_per_dealer" not in constraints:
        schema_editor.add_constraint(
            DealerProduct,
            models.UniqueConstraint(
                "dealer_profile",
                "product_master",
                condition=Q(
                    product_master__isnull=False,
                    status__in=["pending", "active", "inactive", "rejected"],
                ),
                name="unique_dealer_product_master_per_dealer",
            ),
        )

    if "unique_dealer_product_title_per_dealer_no_master" not in constraints:
        schema_editor.add_constraint(
            DealerProduct,
            models.UniqueConstraint(
                Lower("title"),
                "dealer_profile",
                condition=Q(
                    product_master__isnull=True,
                    status__in=["pending", "active", "inactive", "rejected"],
                ),
                name="unique_dealer_product_title_per_dealer_no_master",
            ),
        )


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("dealer_products", "0014_canonical_product_single_batch"),
        ("product_catalog", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_product_master_column_if_missing, backwards_noop),
            ],
            state_operations=[
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
            ],
        ),
        migrations.RunPython(backfill_product_master, backwards_noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(remove_title_unique_constraint_if_exists, backwards_noop),
            ],
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="dealerproduct",
                    name="unique_dealer_product_title_per_dealer",
                ),
            ],
        ),
        migrations.RunPython(forwards_merge_by_catalog, backwards_noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_master_constraints_if_missing, backwards_noop),
            ],
            state_operations=[
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
            ],
        ),
    ]

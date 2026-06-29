"""Backfill expiry_date cho lô tồn kho chưa có ngày hết hạn."""

from django.core.management.base import BaseCommand

from apps.dealer_products.inventory_expiry import backfill_batch_expiry_dates


class Command(BaseCommand):
    help = (
        "Gán expiry_date = import_date + storage_duration_days (SP NCC) "
        "cho các lô tồn kho đại lý."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dealer-id",
            type=int,
            default=None,
            help="Chỉ backfill lô của dealer (DealerProfile.id). Mặc định: tất cả.",
        )
        parser.add_argument(
            "--recompute",
            action="store_true",
            help="Tính lại cả lô đã có expiry_date.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chỉ đếm số lô sẽ cập nhật, không ghi DB.",
        )
        parser.add_argument(
            "--default-days",
            type=int,
            default=None,
            help="Dùng khi SP NCC có storage_duration_days placeholder / không hợp lệ.",
        )
        parser.add_argument(
            "--fix-supplier-products",
            action="store_true",
            help="Sửa storage_duration_days trên SP NCC trước khi backfill (cần --default-days).",
        )

    def handle(self, *args, **options):
        dealer_id = options["dealer_id"]
        recompute = options["recompute"]
        dry_run = options["dry_run"]
        default_days = options["default_days"]
        fix_supplier = options["fix_supplier_products"]

        if fix_supplier and default_days is None:
            self.stderr.write(self.style.ERROR("--fix-supplier-products cần --default-days."))
            return

        result = backfill_batch_expiry_dates(
            dealer_profile_id=dealer_id,
            only_null=not recompute,
            recompute=recompute,
            dry_run=dry_run,
            fallback_storage_days=default_days,
            fix_supplier_products=fix_supplier,
        )

        prefix = "[dry-run] " if dry_run else ""
        scope = f"dealer_id={dealer_id}" if dealer_id else "tất cả dealer"
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}Backfill ({scope}): "
                f"updated={result['updated']}, skipped={result['skipped']}, "
                f"fixed_supplier_products={result['fixed_supplier_products']}"
            )
        )
        for row in result["skipped_batches"]:
            self.stdout.write(f"  skip batch #{row['batch_id']}: {row['reason']}")

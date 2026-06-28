"""Sửa storage_duration_days placeholder trên sản phẩm NCC."""

from django.core.management.base import BaseCommand

from apps.dealer_products.inventory_expiry import (
    MAX_STORAGE_DURATION_DAYS,
    fix_invalid_supplier_storage_duration_days,
)


class Command(BaseCommand):
    help = (
        "Đặt lại storage_duration_days cho SP NCC có giá trị placeholder "
        f"(> {MAX_STORAGE_DURATION_DAYS} hoặc <= 0)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--default-days",
            type=int,
            required=True,
            help=f"Số ngày bảo quản mới (1–{MAX_STORAGE_DURATION_DAYS}).",
        )
        parser.add_argument(
            "--supplier-id",
            type=int,
            default=None,
            help="Chỉ sửa SP của NCC này.",
        )
        parser.add_argument(
            "--dealer-id",
            type=int,
            default=None,
            help="Chỉ sửa SP mà dealer này đang bán.",
        )

    def handle(self, *args, **options):
        updated = fix_invalid_supplier_storage_duration_days(
            default_days=options["default_days"],
            supplier_id=options["supplier_id"],
            dealer_profile_id=options["dealer_id"],
        )
        self.stdout.write(
            self.style.SUCCESS(f"Đã cập nhật {updated} sản phẩm NCC.")
        )

"""Thay slug đọc được bằng mã cửa hàng ngẫu nhiên."""

from django.db import migrations

from apps.dealers.store_code import assign_unique_store_code


def regenerate_store_codes(apps, schema_editor):
    DealerProfile = apps.get_model("dealers", "DealerProfile")
    for dealer in DealerProfile.objects.all().order_by("id"):
        dealer.slug = assign_unique_store_code(DealerProfile, exclude_pk=dealer.pk)
        dealer.save(update_fields=["slug"])


class Migration(migrations.Migration):

    dependencies = [
        ("dealers", "0004_dealerprofile_logo"),
    ]

    operations = [
        migrations.RunPython(regenerate_store_codes, migrations.RunPython.noop),
    ]

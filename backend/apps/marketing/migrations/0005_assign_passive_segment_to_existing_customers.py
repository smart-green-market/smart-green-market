from django.db import migrations


def assign_passive_to_existing_customers(apps, schema_editor):
    CustomerProfile = apps.get_model("customers", "CustomerProfile")
    CustomerSegment = apps.get_model("marketing", "CustomerSegment")
    CustomerSegmentMember = apps.get_model("marketing", "CustomerSegmentMember")

    passive = CustomerSegment.objects.filter(code="PASSIVE").first()
    if passive is None:
        return

    profile_ids_with_segment = CustomerSegmentMember.objects.values_list(
        "customer_profile_id",
        flat=True,
    ).distinct()
    profiles_without_segment = CustomerProfile.objects.exclude(
        id__in=profile_ids_with_segment,
    )
    members = [
        CustomerSegmentMember(customer_profile=profile, segment=passive)
        for profile in profiles_without_segment
    ]
    if members:
        CustomerSegmentMember.objects.bulk_create(members, ignore_conflicts=True)


class Migration(migrations.Migration):

    dependencies = [
        ("marketing", "0004_seed_system_customer_segments"),
        ("customers", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            assign_passive_to_existing_customers,
            migrations.RunPython.noop,
        ),
    ]

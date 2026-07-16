from django.db import migrations


def seed_loyalty_data(apps, schema_editor):
    from apps.loyalty.tier_defaults import get_base_tier_for_dealer, seed_all_dealers_loyalty

    seed_all_dealers_loyalty(apps=apps)

    CustomerProfile = apps.get_model("customers", "CustomerProfile")
    Account = apps.get_model("accounts", "Account")
    DealerProfile = apps.get_model("dealers", "DealerProfile")

    for profile in CustomerProfile.objects.all().iterator():
        user = Account.objects.filter(pk=profile.user_id).first()
        if user is None or not user.store_dealer_id:
            continue
        dealer = DealerProfile.objects.filter(pk=user.store_dealer_id).first()
        if dealer is None:
            continue
        base_tier = get_base_tier_for_dealer(dealer, apps=apps)
        if base_tier is None:
            continue
        profile.current_tier_id = base_tier.id
        profile.save(update_fields=["current_tier_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("loyalty", "0001_loyalty_tiers"),
        ("customers", "0003_loyalty_tiers"),
    ]

    operations = [
        migrations.RunPython(seed_loyalty_data, migrations.RunPython.noop),
    ]

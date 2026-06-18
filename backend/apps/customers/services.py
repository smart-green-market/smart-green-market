"""Helper nghiệp vụ khách hàng gian hàng đại lý."""

from django.contrib.auth import get_user_model

from apps.accounts.models import AccountRole
from apps.dealers.models import DealerProfile, DealerProfileStatus

Account = get_user_model()


def get_active_dealer_by_slug(slug):
    """Lấy đại lý active theo slug URL gian hàng."""
    from apps.accounts.models import AccountStatus

    return DealerProfile.objects.select_related("account").get(
        slug=slug,
        status=DealerProfileStatus.ACTIVE,
        account__status=AccountStatus.ACTIVE,
    )


def build_storefront_username(dealer_id, email):
    """Sinh username nội bộ unique — buyer đăng nhập bằng email trên storefront."""
    normalized = email.lower().strip().replace("@", "_at_")
    base = f"store-{dealer_id}-{normalized}"[:140]
    username = base
    suffix = 1
    while Account.objects.filter(username=username).exists():
        suffix += 1
        username = f"{base}-{suffix}"[:150]
    return username


def storefront_buyer_exists(dealer, email):
    """Kiểm tra buyer đã đăng ký tại cửa hàng đại lý này chưa."""
    return Account.objects.filter(
        role=AccountRole.BUYER,
        store_dealer=dealer,
        email__iexact=email.strip(),
    ).exists()

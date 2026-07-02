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


def customer_profile_detail_queryset():
    """Queryset hồ sơ buyer kèm user, danh mục yêu thích, địa chỉ và segment."""
    from django.db.models import Prefetch

    from apps.marketing.models import CustomerSegmentMember

    from .models import CustomerProfile

    return CustomerProfile.objects.select_related(
        "user",
        "user__store_dealer",
        "favorite_category",
    ).prefetch_related(
        "addresses",
        Prefetch(
            "segment_memberships",
            queryset=CustomerSegmentMember.objects.select_related("segment"),
        ),
    )


def resolve_favorite_category_id(items_data):
    """Category có tổng quantity lớn nhất trong đơn; hòa thì chọn id nhỏ hơn."""
    counts = {}
    for row in items_data:
        category_id = row["dealer_product"].category_id
        if not category_id:
            continue
        qty = int(row["quantity"])
        counts[category_id] = counts.get(category_id, 0) + qty
    if not counts:
        return None
    return max(counts.items(), key=lambda item: (item[1], -item[0]))[0]


def update_favorite_category_from_order(customer, items_data):
    """Cập nhật favorite_category khi buyer đặt hàng."""
    category_id = resolve_favorite_category_id(items_data)
    if category_id is None:
        return
    if customer.favorite_category_id != category_id:
        customer.favorite_category_id = category_id
        customer.save(update_fields=["favorite_category", "updated_at"])


def assign_default_customer_segment(customer_profile):
    """Gán nhóm khách PASSIVE (mặc định) cho hồ sơ buyer mới."""
    from apps.marketing.models import CustomerSegment, CustomerSegmentMember
    from apps.marketing.segment_defaults import DEFAULT_CUSTOMER_SEGMENT_CODE

    segment = CustomerSegment.objects.filter(
        code=DEFAULT_CUSTOMER_SEGMENT_CODE,
    ).first()
    if segment is None:
        return
    CustomerSegmentMember.objects.get_or_create(
        customer_profile=customer_profile,
        segment=segment,
    )

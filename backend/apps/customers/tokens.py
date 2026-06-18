"""JWT token gắn phạm vi gian hàng đại lý."""

from rest_framework_simplejwt.tokens import RefreshToken


class StorefrontRefreshToken(RefreshToken):
    """Refresh token kèm claim dealer cho buyer storefront."""

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        dealer = user.store_dealer
        if dealer is not None:
            token["auth_scope"] = "storefront"
            token["store_dealer_id"] = dealer.id
            token["store_dealer_slug"] = dealer.slug
        return token

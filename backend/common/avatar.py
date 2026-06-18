"""Helper xây dựng URL ảnh đại diện từ tài khoản."""

from common.files import build_media_url


def _avatar_cache_buster(account, url):
    """Thêm query version để client không dùng ảnh cũ khi URL path không đổi."""
    version = None
    if getattr(account, "updated_at", None):
        version = int(account.updated_at.timestamp())
    elif account.avatar and getattr(account.avatar, "name", None):
        version = abs(hash(account.avatar.name)) % (10**8)
    if version is None:
        return url
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}v={version}"


def build_avatar_url(account, request=None):
    """Trả URL đầy đủ của avatar; None nếu tài khoản chưa có ảnh."""
    url = build_media_url(account.avatar, request)
    if not url:
        return None
    return _avatar_cache_buster(account, url)


def save_account_avatar(account, file):
    """Lưu avatar mới, xóa file cũ và trả account đã reload từ DB."""
    if account.avatar:
        account.avatar.delete(save=False)
    account.avatar = file
    account.save(update_fields=["avatar", "updated_at"])
    return account.__class__.objects.get(pk=account.pk)


def clear_account_avatar(account):
    """Xóa avatar hiện tại và trả account đã reload từ DB."""
    if account.avatar:
        account.avatar.delete(save=False)
        account.avatar = None
        account.save(update_fields=["avatar", "updated_at"])
    return account.__class__.objects.get(pk=account.pk)

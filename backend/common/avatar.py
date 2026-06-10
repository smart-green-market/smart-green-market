"""Helper xây dựng URL ảnh đại diện từ tài khoản."""

from common.files import build_media_url


def build_avatar_url(account, request=None):
    """Trả URL đầy đủ của avatar; None nếu tài khoản chưa có ảnh."""
    return build_media_url(account.avatar, request)

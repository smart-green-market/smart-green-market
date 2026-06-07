from common.files import build_media_url


def build_avatar_url(account, request=None):
    return build_media_url(account.avatar, request)

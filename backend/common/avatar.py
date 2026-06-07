def build_avatar_url(account, request=None):
    if not account.avatar:
        return None
    url = account.avatar.url
    if request is not None:
        return request.build_absolute_uri(url)
    return url

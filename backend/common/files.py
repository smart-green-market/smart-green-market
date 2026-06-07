"""URL helpers cho file upload (local hoặc Cloudinary)."""


def build_media_url(file_field, request=None):
    """Trả URL đầy đủ — Cloudinary đã là https, local cần build_absolute_uri."""
    if not file_field:
        return None
    url = file_field.url
    if url.startswith(("http://", "https://")):
        return url
    if request is not None:
        return request.build_absolute_uri(url)
    return url

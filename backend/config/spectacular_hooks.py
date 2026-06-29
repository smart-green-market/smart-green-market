"""Hooks drf-spectacular — server URL khớp host đang mở Swagger."""


def postprocess_schema_servers(result, generator, request, public):
    """Gắn `servers` theo request để Swagger Try it out không gọi localhost sai."""
    if request is not None:
        base = request.build_absolute_uri("/").rstrip("/")
    else:
        from django.conf import settings

        base = getattr(settings, "API_PUBLIC_BASE_URL", "http://127.0.0.1:8000")

    result["servers"] = [{"url": base, "description": "API hiện tại"}]
    return result

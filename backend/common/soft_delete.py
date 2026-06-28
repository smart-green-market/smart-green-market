"""Helper soft-delete — mã lỗi thống nhất cho API archive."""

from rest_framework.exceptions import ValidationError


def soft_delete_blocked(*, code: str, detail: str, **extra):
    """Raise ValidationError 400 với `code` machine-readable."""
    payload = {"detail": detail, "code": code}
    if extra:
        payload.update(extra)
    raise ValidationError(payload)


def default_exclude_deleted(qs, request, *, status_field: str, deleted_value: str):
    """List mặc định ẩn bản ghi đã soft-delete trừ khi ?status=deleted."""
    status_param = (request.query_params.get("status") or "").strip()
    if not status_param:
        return qs.exclude(**{status_field: deleted_value})
    return qs

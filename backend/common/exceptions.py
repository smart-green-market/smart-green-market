"""Chuẩn hóa response lỗi DRF để frontend hiển thị nguyên nhân rõ ràng."""

from django.conf import settings
from rest_framework.exceptions import ErrorDetail
from rest_framework.views import exception_handler


ERROR_MESSAGES = {
    400: "Yêu cầu không hợp lệ.",
    401: "Bạn cần đăng nhập để thực hiện thao tác này.",
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Không tìm thấy tài nguyên.",
    405: "Phương thức không được hỗ trợ.",
    406: "Không chấp nhận định dạng phản hồi.",
    415: "Định dạng dữ liệu gửi lên không được hỗ trợ.",
    429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
}


def _plain_detail(value):
    """Chuyển ErrorDetail/list/dict về dữ liệu JSON đơn giản."""
    if isinstance(value, ErrorDetail):
        return str(value)
    if isinstance(value, dict):
        return {key: _plain_detail(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_plain_detail(item) for item in value]
    return value


def _first_message(detail):
    """Lấy message dễ đọc nhất từ detail do DRF trả về."""
    detail = _plain_detail(detail)
    if isinstance(detail, dict):
        if "detail" in detail:
            return _first_message(detail["detail"])
        if "non_field_errors" in detail:
            return _first_message(detail["non_field_errors"])
        for field, messages in detail.items():
            message = _first_message(messages)
            if message:
                return f"{field}: {message}"
        return None
    if isinstance(detail, list):
        for item in detail:
            message = _first_message(item)
            if message:
                return message
        return None
    if detail:
        return str(detail)
    return None


def _error_code(exc, response):
    code = getattr(exc, "default_code", None)
    if code:
        return str(code)
    status_code = getattr(response, "status_code", None)
    return {
        400: "bad_request",
        401: "authentication_failed",
        403: "permission_denied",
        404: "not_found",
        405: "method_not_allowed",
        406: "not_acceptable",
        415: "unsupported_media_type",
        429: "throttled",
    }.get(status_code, "api_error")


def custom_exception_handler(exc, context):
    """Trả lỗi dạng thống nhất: detail/message/errors/status_code/error_code."""
    response = exception_handler(exc, context)
    if response is None:
        return None

    original_detail = _plain_detail(response.data)
    status_code = response.status_code
    message = _first_message(original_detail) or ERROR_MESSAGES.get(
        status_code,
        "Có lỗi xảy ra.",
    )

    payload = {
        "success": False,
        "status_code": status_code,
        "error_code": _error_code(exc, response),
        "message": message,
        # Giữ field detail để frontend cũ đang đọc response.data.detail vẫn hoạt động.
        "detail": message,
        "errors": original_detail,
    }

    if settings.DEBUG and status_code >= 500:
        payload["exception"] = exc.__class__.__name__

    response.data = payload
    return response

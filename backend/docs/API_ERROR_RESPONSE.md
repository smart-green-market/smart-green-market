# API Error Response Format

Backend chuẩn hóa lỗi DRF qua `common.exceptions.custom_exception_handler`.

## Response chung

```json
{
  "success": false,
  "status_code": 400,
  "error_code": "invalid",
  "message": "email: Enter a valid email address.",
  "detail": "email: Enter a valid email address.",
  "errors": {
    "email": ["Enter a valid email address."]
  }
}
```

## Ý nghĩa field

| Field | Ý nghĩa |
|-------|---------|
| `success` | Luôn là `false` khi lỗi |
| `status_code` | HTTP status code (`400`, `401`, `403`, `404`, ...) |
| `error_code` | Mã lỗi ngắn từ DRF (`invalid`, `not_authenticated`, `permission_denied`, ...) |
| `message` | Message dễ hiển thị nhất cho user |
| `detail` | Alias của `message` để tương thích frontend cũ |
| `errors` | Chi tiết lỗi gốc, gồm field errors nếu có |

## Cách frontend nên đọc

Ưu tiên:

```js
const message =
  error.response?.data?.message ||
  error.response?.data?.detail ||
  "Có lỗi xảy ra";
```

Nếu cần highlight lỗi từng field:

```js
const fieldErrors = error.response?.data?.errors;
```

## Ví dụ 403

```json
{
  "success": false,
  "status_code": 403,
  "error_code": "permission_denied",
  "message": "Token không thuộc gian hàng đại lý này.",
  "detail": "Token không thuộc gian hàng đại lý này.",
  "errors": {
    "detail": "Token không thuộc gian hàng đại lý này."
  }
}
```

"""Chuẩn hóa nested list từ multipart/form-data (Swagger, FormData FE).

Multipart thường gửi `items` là:
- JSON string trong field `items` (Swagger hay dùng)
- một dict / array (application/json)
- form phẳng `items[0]field` (DRF parse qua QueryDict)

Lưu ý: DRF `get_value()` với QueryDict luôn gọi `parse_html_dictionary`
(prefix=items) và bỏ qua key `items` chứa JSON string — cần flatten sang dict.
"""

import json

from rest_framework import serializers
from rest_framework.utils import html


def normalize_nested_list_value(value, field_label="items"):
    """Chuẩn hóa giá trị nested list trước khi validate serializer."""
    if value is None:
        return None

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            value = json.loads(stripped)
        except json.JSONDecodeError:
            raise serializers.ValidationError(
                {field_label: "JSON không hợp lệ. Gửi array hoặc một object."}
            )

    if isinstance(value, dict):
        return [value]

    if isinstance(value, list):
        return value

    raise serializers.ValidationError(
        {field_label: "Cần danh sách object hoặc một object."}
    )


def flatten_multipart_nested_data(data, nested_list_fields=("items",)):
    """Chuyển QueryDict/multipart sang plain dict để nested list validate đúng."""
    if hasattr(data, "keys"):
        flat = {key: data.get(key) for key in data.keys()}
    else:
        flat = dict(data)

    is_querydict = hasattr(data, "getlist") and html.is_html_input(data)

    for field_name in nested_list_fields:
        indexed = None
        if is_querydict:
            indexed = html.parse_html_list(data, prefix=field_name, default=None)

        simple_value = flat.get(field_name)
        if indexed is not None:
            flat[field_name] = indexed
        elif simple_value is not None:
            flat[field_name] = normalize_nested_list_value(
                simple_value,
                field_label=field_name,
            )

    return flat


class MultipartNestedListSerializerMixin:
    """Mixin cho Serializer nhận nested list qua multipart."""

    nested_list_fields = ("items",)

    def __init__(self, *args, **kwargs):
        data = kwargs.get("data")
        if data is not None:
            kwargs["data"] = flatten_multipart_nested_data(
                data,
                nested_list_fields=self.nested_list_fields,
            )
        super().__init__(*args, **kwargs)

"""ChoiceField cho Swagger — không dùng help_text để UI hiển thị dropdown (enum)."""

from rest_framework import serializers


def schema_choice_field(choices, **kwargs):
    """ChoiceField tối ưu schema OpenAPI (tránh allOf → Swagger UI thành ô text)."""
    kwargs.pop("help_text", None)
    return serializers.ChoiceField(choices=choices, **kwargs)

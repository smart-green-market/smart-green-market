"""Mã cửa hàng công khai (Meet-style) — lưu trong DealerProfile.slug."""

import re
import secrets
import string

STORE_CODE_ALPHABET = string.ascii_lowercase + string.digits
STORE_CODE_PART_LEN = 3
STORE_CODE_PARTS = 3
STORE_CODE_PATTERN = re.compile(
    rf"^[a-z0-9]{{{STORE_CODE_PART_LEN}}}"
    rf"(?:-[a-z0-9]{{{STORE_CODE_PART_LEN}}}){{{STORE_CODE_PARTS - 1}}}$"
)


def generate_store_code() -> str:
    """Sinh mã ngẫu nhiên dạng abc-def-ghi."""
    parts = [
        "".join(secrets.choice(STORE_CODE_ALPHABET) for _ in range(STORE_CODE_PART_LEN))
        for _ in range(STORE_CODE_PARTS)
    ]
    return "-".join(parts)


def assign_unique_store_code(dealer_model, *, exclude_pk=None) -> str:
    """Sinh mã chưa tồn tại trong cột slug."""
    for _ in range(128):
        code = generate_store_code()
        qs = dealer_model.objects.filter(slug=code)
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        if not qs.exists():
            return code
    raise RuntimeError("Không thể sinh mã cửa hàng unique.")

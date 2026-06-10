"""Sinh URL ảnh QR chuyển khoản VietQR (img.vietqr.io)."""

from urllib.parse import quote

from rest_framework.exceptions import ValidationError

from common.banks import BANK_NAME_TO_BIN, get_bank_by_bin

VIETQR_IMAGE_BASE = "https://img.vietqr.io/image"
DEFAULT_QR_TEMPLATE = "compact2"


def _normalize_bank_name(name: str) -> str:
    return " ".join(name.lower().strip().split())


def resolve_bank_bin(*, bank_bin: str, bank_name: str) -> str:
    """Lấy BIN 6 số từ bank_bin hoặc map tên ngân hàng."""
    if bank_bin and bank_bin.strip().isdigit() and len(bank_bin.strip()) == 6:
        return bank_bin.strip()
    if bank_name:
        key = _normalize_bank_name(bank_name)
        if key in BANK_NAME_TO_BIN:
            return BANK_NAME_TO_BIN[key]
        for token, bin_code in BANK_NAME_TO_BIN.items():
            if token in key or key in token:
                return bin_code
    raise ValidationError(
        {
            "bank_bin": (
                "Không xác định được mã BIN ngân hàng. "
                "Chọn ngân hàng từ GET /api/banks/ hoặc cập nhật bank_bin (6 số)."
            )
        }
    )


def build_vietqr_image_url(
    *,
    bank_bin: str,
    account_number: str,
    account_name: str,
    amount,
    transfer_content: str,
    template: str = DEFAULT_QR_TEMPLATE,
) -> str:
    """Tạo URL ảnh QR VietQR."""
    account_number = account_number.strip().replace(" ", "")
    if not account_number:
        raise ValidationError({"account_number": "Số tài khoản NCC chưa được cấu hình."})

    path = f"{VIETQR_IMAGE_BASE}/{bank_bin}-{account_number}-{template}.png"
    params = []
    if amount is not None:
        params.append(f"amount={int(amount)}")
    if transfer_content:
        params.append(f"addInfo={quote(str(transfer_content), safe='')}")
    if account_name:
        params.append(f"accountName={quote(str(account_name), safe='')}")
    if not params:
        return path
    return f"{path}?{'&'.join(params)}"


def build_supplier_payment_qr(
    supplier,
    *,
    amount,
    transfer_content: str,
    template: str = DEFAULT_QR_TEMPLATE,
) -> dict:
    """Trả metadata + URL QR từ thông tin ngân hàng supplier."""
    if not supplier.account_name.strip():
        raise ValidationError({"account_name": "Tên chủ tài khoản NCC chưa được cấu hình."})

    bank_bin = resolve_bank_bin(
        bank_bin=getattr(supplier, "bank_bin", "") or "",
        bank_name=supplier.bank_name or "",
    )
    bank_meta = get_bank_by_bin(bank_bin)
    qr_image_url = build_vietqr_image_url(
        bank_bin=bank_bin,
        account_number=supplier.account_number or "",
        account_name=supplier.account_name,
        amount=amount,
        transfer_content=transfer_content,
        template=template,
    )
    return {
        "qr_image_url": qr_image_url,
        "bank_bin": bank_bin,
        "bank_name": bank_meta["name"] if bank_meta else supplier.bank_name,
        "bank_code": bank_meta["code"] if bank_meta else None,
        "account_number": supplier.account_number,
        "account_name": supplier.account_name,
        "amount": amount,
        "transfer_content": transfer_content,
        "template": template,
    }

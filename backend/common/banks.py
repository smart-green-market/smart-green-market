"""Danh sách ngân hàng Napas/VietQR — nguồn dữ liệu cho UI select và resolve BIN."""

# Một nguồn duy nhất: UI chọn từ đây → lưu bank_bin + bank_name khớp VietQR.
VIETQR_BANKS = [
    {
        "code": "VCB",
        "name": "Vietcombank",
        "bin": "970436",
        "full_name": "Ngân hàng TMCP Ngoại thương Việt Nam",
    },
    {
        "code": "BIDV",
        "name": "BIDV",
        "bin": "970418",
        "full_name": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    },
    {
        "code": "CTG",
        "name": "VietinBank",
        "bin": "970415",
        "full_name": "Ngân hàng TMCP Công thương Việt Nam",
    },
    {
        "code": "VARB",
        "name": "Agribank",
        "bin": "970405",
        "full_name": "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
    },
    {
        "code": "TCB",
        "name": "Techcombank",
        "bin": "970407",
        "full_name": "Ngân hàng TMCP Kỹ thương Việt Nam",
    },
    {
        "code": "MB",
        "name": "MBBank",
        "bin": "970422",
        "full_name": "Ngân hàng TMCP Quân đội",
    },
    {
        "code": "ACB",
        "name": "ACB",
        "bin": "970416",
        "full_name": "Ngân hàng TMCP Á Châu",
    },
    {
        "code": "TPB",
        "name": "TPBank",
        "bin": "970423",
        "full_name": "Ngân hàng TMCP Tiên Phong",
    },
    {
        "code": "VPB",
        "name": "VPBank",
        "bin": "970432",
        "full_name": "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    },
    {
        "code": "STB",
        "name": "Sacombank",
        "bin": "970403",
        "full_name": "Ngân hàng TMCP Sài Gòn Thương Tín",
    },
    {
        "code": "HDB",
        "name": "HDBank",
        "bin": "970437",
        "full_name": "Ngân hàng TMCP Phát triển TP.HCM",
    },
    {
        "code": "VIB",
        "name": "VIB",
        "bin": "970441",
        "full_name": "Ngân hàng TMCP Quốc tế Việt Nam",
    },
    {
        "code": "SHB",
        "name": "SHB",
        "bin": "970443",
        "full_name": "Ngân hàng TMCP Sài Gòn - Hà Nội",
    },
    {
        "code": "OCB",
        "name": "OCB",
        "bin": "970448",
        "full_name": "Ngân hàng TMCP Phương Đông",
    },
    {
        "code": "MSB",
        "name": "MSB",
        "bin": "970426",
        "full_name": "Ngân hàng TMCP Hàng Hải Việt Nam",
    },
    {
        "code": "LPB",
        "name": "LienVietPostBank",
        "bin": "970449",
        "full_name": "Ngân hàng TMCP Bưu điện Liên Việt",
    },
    {
        "code": "SEAB",
        "name": "SeABank",
        "bin": "970440",
        "full_name": "Ngân hàng TMCP Đông Nam Á",
    },
    {
        "code": "EIB",
        "name": "Eximbank",
        "bin": "970431",
        "full_name": "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
    },
    {
        "code": "VCCB",
        "name": "VietCapitalBank",
        "bin": "970454",
        "full_name": "Ngân hàng TMCP Bản Việt",
    },
    {
        "code": "NAB",
        "name": "Nam A Bank",
        "bin": "970428",
        "full_name": "Ngân hàng TMCP Nam Á",
    },
]

BANKS_BY_BIN = {b["bin"]: b for b in VIETQR_BANKS}
BANKS_BY_CODE = {b["code"].lower(): b for b in VIETQR_BANKS}


def _build_name_aliases():
    aliases = {}
    for bank in VIETQR_BANKS:
        aliases[_normalize(bank["name"])] = bank["bin"]
        aliases[_normalize(bank["code"])] = bank["bin"]
        aliases[_normalize(bank["full_name"])] = bank["bin"]
    # Alias bổ sung cho resolve lịch sử
    extras = {
        "vcb": "970436",
        "mb bank": "970422",
        "quân đội": "970422",
        "ngan hang tmcp ngoai thuong viet nam": "970436",
        "vbard": "970405",
    }
    for key, bin_code in extras.items():
        aliases.setdefault(_normalize(key), bin_code)
    return aliases


def _normalize(name: str) -> str:
    return " ".join(name.lower().strip().split())


BANK_NAME_TO_BIN = _build_name_aliases()


def get_vietqr_banks():
    """Danh sách ngân hàng cho API / UI select."""
    return VIETQR_BANKS


def is_valid_bank_bin(bank_bin: str) -> bool:
    return bank_bin in BANKS_BY_BIN


def get_bank_by_bin(bank_bin: str):
    return BANKS_BY_BIN.get(bank_bin)

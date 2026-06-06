from apps.categories.models import CategoryStatus
from apps.certifications.models import CertificationStatus
from apps.suppliers.models import (
    SupplierDocumentStatus,
    SupplierDocumentType,
    SupplierVerificationStatus,
)


STATUS_VI = {
    "pending": "Chờ duyệt",
    "approved": "Đã duyệt",
    "rejected": "Từ chối",
    "active": "Đã kích hoạt",
    "inactive": "Ngừng hoạt động",
}

REFERENCE_TYPE_VI = {
    "supplier_document": "Giấy tờ nhà cung cấp",
    "supplier": "Hồ sơ nhà cung cấp",
    "category": "Danh mục sản phẩm",
    "certification": "Chứng nhận chất lượng",
    "supplier_product": "Sản phẩm",
}
NOTIFICATION_TYPE_VI = {
    "info": "Thông tin",
    "warning": "Cảnh báo",
    "success": "Thành công",
    "error": "Thất bại",
}

DOCUMENT_TYPE_VI = {
    SupplierDocumentType.BUSINESS_LICENSE: "Giấy phép kinh doanh",
    SupplierDocumentType.ID_CARD: "CMND/CCCD",
    SupplierDocumentType.TAX_CERTIFICATE: "Giấy chứng nhận thuế",
}


def status_label(status):
    return STATUS_VI.get(status, status)


def reference_type_label(reference_type):
    if not reference_type:
        return ""
    return REFERENCE_TYPE_VI.get(reference_type, reference_type)


def notification_type_label(notif_type):
    return NOTIFICATION_TYPE_VI.get(notif_type, notif_type)


def document_type_label(document_type):
    return DOCUMENT_TYPE_VI.get(document_type, document_type)


def plain_notification_text(text):
    """Chuẩn hóa nội dung thông báo thành một dòng text đơn giản."""
    if not text:
        return ""
    normalized = str(text).replace("\\n", " ").replace("\n", " ").replace("\r", " ")
    return " ".join(normalized.split())


def admin_new_supplier_document(document):
    supplier = document.supplier
    doc_label = document_type_label(document.document_type)
    return (
        "[Giấy tờ] Có giấy tờ mới chờ duyệt",
        f"{doc_label} của {supplier.company_name} cần được duyệt.",
    )


def supplier_document_reviewed(document):
    doc_label = document_type_label(document.document_type)
    status = status_label(document.status)
    if document.status == SupplierDocumentStatus.APPROVED:
        return (
            f"[Giấy tờ] {doc_label} — {status}",
            f"Giấy tờ {doc_label} của bạn đã được duyệt.",
            "success",
        )
    return (
        f"[Giấy tờ] {doc_label} — {status}",
        f"Giấy tờ {doc_label} của bạn đã bị từ chối. Vui lòng upload lại.",
        "error",
    )


def admin_new_category(category, creator_username):
    return (
        "[Danh mục] Có danh mục mới chờ duyệt",
        f"Danh mục {category.name} do {creator_username} tạo cần được duyệt.",
    )


def category_reviewed(category):
    status = status_label(category.status)
    if category.status == CategoryStatus.ACTIVE:
        return (
            f"[Danh mục] {category.name} — {status}",
            f"Danh mục {category.name} của bạn đã được duyệt.",
            "success",
        )
    if category.status == CategoryStatus.INACTIVE:
        return (
            f"[Danh mục] {category.name} — {status}",
            f"Danh mục {category.name} đã bị khóa.",
            "warning",
        )
    reason = category.rejection_reason.strip()
    content = f"Danh mục {category.name} của bạn đã bị từ chối."
    if reason:
        content = f"{content} Lý do: {reason}"
    return (
        f"[Danh mục] {category.name} — {status}",
        content,
        "error",
    )


def admin_new_certification(certification):
    supplier = certification.supplier
    return (
        "[Chứng nhận] Có chứng nhận mới chờ duyệt",
        f"Chứng nhận {certification.name} của {supplier.company_name} cần được duyệt.",
    )


def certification_reviewed(certification):
    status = status_label(certification.status)
    if certification.status == CertificationStatus.APPROVED:
        return (
            f"[Chứng nhận] {certification.name} — {status}",
            f"Chứng nhận {certification.name} của bạn đã được duyệt.",
            "success",
        )
    reason = certification.rejection_reason.strip()
    content = f"Chứng nhận {certification.name} của bạn đã bị từ chối."
    if reason:
        content = f"{content} Lý do: {reason}"
    return (
        f"[Chứng nhận] {certification.name} — {status}",
        content,
        "error",
    )


def supplier_verification_updated(supplier):
    status = status_label(supplier.verification_status)
    if supplier.verification_status == SupplierVerificationStatus.APPROVED:
        return (
            f"[Hồ sơ NCC] {supplier.company_name} — {status}",
            f"Hồ sơ {supplier.company_name} đã được duyệt. Bạn có thể đăng sản phẩm.",
            "success",
        )
    if supplier.verification_status == SupplierVerificationStatus.REJECTED:
        return (
            f"[Hồ sơ NCC] {supplier.company_name} — {status}",
            f"Hồ sơ {supplier.company_name} đã bị từ chối. Vui lòng kiểm tra giấy tờ.",
            "error",
        )
    return (
        f"[Hồ sơ NCC] {supplier.company_name} — {status}",
        f"Trạng thái hồ sơ {supplier.company_name} đã cập nhật thành {status}.",
        "info",
    )

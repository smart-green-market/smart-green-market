"""Mẫu nội dung thông báo và helper dịch nhãn sang tiếng Việt."""

from apps.categories.models import CategoryStatus
from apps.certifications.models import CertificationStatus
from apps.accounts.models import AccountDocumentStatus, AccountDocumentType
from apps.suppliers.models import SupplierVerificationStatus


STATUS_VI = {
    "pending": "Chờ duyệt",
    "approved": "Đã duyệt",
    "rejected": "Từ chối",
    "active": "Đã kích hoạt",
    "inactive": "Ngừng hoạt động",
    # Phiếu nhập hàng
    "pending_supplier_confirmation": "Chờ NCC xác nhận",
    "pending_dealer_confirmation": "Chờ đại lý xác nhận điều chỉnh",
    "confirmed": "Đã xác nhận",
    "deposit_pending_verification": "Chờ xác nhận tiền cọc",
    "deposit_paid": "Đã thanh toán cọc",
    "processing": "Đang chuẩn bị",
    "shipping": "Đang giao",
    "delivered": "Đã giao",
    "final_payment_pending_verification": "Chờ xác nhận thanh toán cuối",
    "return_requested": "Yêu cầu trả hàng",
    "return_approved": "Đã duyệt trả hàng",
    "return_rejected": "Từ chối trả hàng",
    "returned": "Đã trả hàng",
    "completed": "Hoàn tất",
    "cancelled": "Đã hủy",
}

CUSTOMER_ORDER_STATUS_VI = {
    "pending": "Chờ xác nhận",
    "confirmed": "Đã xác nhận",
    "processing": "Đang chuẩn bị",
    "shipping": "Đang giao",
    "delivered": "Đã giao",
    "completed": "Hoàn tất",
    "cancel_requested": "Yêu cầu hủy",
    "delivery_failed": "Giao thất bại",
    "return_requested": "Yêu cầu trả hàng",
    "return_approved": "Đã duyệt trả hàng",
    "return_rejected": "Từ chối trả hàng",
    "returned": "Đã trả hàng",
    "cancelled": "Đã hủy",
}

REFERENCE_TYPE_VI = {
    "account_document": "Giấy tờ tài khoản",
    "purchase_order": "Phiếu nhập hàng",
    "customer_order": "Đơn hàng khách",
    "supplier_document": "Giấy tờ nhà cung cấp",
    "supplier": "Hồ sơ nhà cung cấp",
    "dealer": "Hồ sơ đại lý",
    "category": "Danh mục sản phẩm",
    "certification": "Chứng nhận chất lượng",
    "supplier_product": "Sản phẩm NCC",
    "dealer_product": "Sản phẩm đại lý",
}
NOTIFICATION_TYPE_VI = {
    "info": "Thông tin",
    "warning": "Cảnh báo",
    "success": "Thành công",
    "error": "Thất bại",
}

DOCUMENT_TYPE_VI = {
    AccountDocumentType.BUSINESS_LICENSE: "Giấy phép kinh doanh",
    AccountDocumentType.ID_CARD: "CMND/CCCD",
    AccountDocumentType.TAX_CERTIFICATE: "Giấy chứng nhận thuế",
}


def _account_display_name(account):
    """Tên hiển thị từ hồ sơ supplier/dealer hoặc tài khoản."""
    supplier = getattr(account, "supplier_profile", None)
    if supplier is not None:
        return supplier.company_name
    dealer = getattr(account, "dealer_profile", None)
    if dealer is not None:
        return dealer.store_name
    return account.full_name or account.username


def status_label(status):
    """Trả nhãn tiếng Việt của trạng thái; giữ nguyên mã nếu không có bản dịch."""
    return STATUS_VI.get(status, status)


def reference_type_label(reference_type):
    """Trả nhãn tiếng Việt của loại đối tượng tham chiếu."""
    if not reference_type:
        return ""
    return REFERENCE_TYPE_VI.get(reference_type, reference_type)


def notification_type_label(notif_type):
    """Trả nhãn tiếng Việt của loại thông báo."""
    return NOTIFICATION_TYPE_VI.get(notif_type, notif_type)


def document_type_label(document_type):
    """Trả nhãn tiếng Việt của loại giấy tờ nhà cung cấp."""
    return DOCUMENT_TYPE_VI.get(document_type, document_type)


def plain_notification_text(text):
    """Chuẩn hóa nội dung thông báo thành một dòng text đơn giản."""
    if not text:
        return ""
    normalized = str(text).replace("\\n", " ").replace("\n", " ").replace("\r", " ")
    return " ".join(normalized.split())


def admin_new_account_document(document):
    """Trả (title, content) thông báo cho admin khi có giấy tờ tài khoản mới chờ duyệt."""
    doc_label = document_type_label(document.document_type)
    owner = _account_display_name(document.account)
    return (
        "[Giấy tờ] Có giấy tờ mới chờ duyệt",
        f"{doc_label} của {owner} cần được duyệt.",
    )


def account_document_reviewed(document, rejection_reason=""):
    """Trả (title, content, type) thông báo sau khi giấy tờ được duyệt/từ chối."""
    doc_label = document_type_label(document.document_type)
    status = status_label(document.status)
    if document.status == AccountDocumentStatus.APPROVED:
        return (
            f"[Giấy tờ] {doc_label} — {status}",
            f"Giấy tờ {doc_label} của bạn đã được duyệt.",
            "success",
        )
    content = f"Giấy tờ {doc_label} của bạn đã bị từ chối. Vui lòng upload lại."
    if rejection_reason.strip():
        content = f"{content} Lý do: {rejection_reason.strip()}"
    return (
        f"[Giấy tờ] {doc_label} — {status}",
        content,
        "error",
    )


def admin_new_category(category, creator_username):
    """Trả (title, content) thông báo cho admin khi có danh mục mới chờ duyệt."""
    return (
        "[Danh mục] Có danh mục mới chờ duyệt",
        f"Danh mục {category.name} do {creator_username} tạo cần được duyệt.",
    )


def category_reviewed(category):
    """Trả (title, content, type) thông báo cho người tạo sau khi danh mục được xử lý."""
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
    """Trả (title, content) thông báo cho admin khi có chứng nhận mới chờ duyệt."""
    supplier = certification.supplier
    return (
        "[Chứng nhận] Có chứng nhận mới chờ duyệt",
        f"Chứng nhận {certification.name} của {supplier.company_name} cần được duyệt.",
    )


def certification_reviewed(certification):
    """Trả (title, content, type) thông báo cho NCC sau khi chứng nhận được xử lý."""
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


def dealer_verification_updated(dealer):
    """Trả (title, content, type) khi trạng thái hồ sơ đại lý thay đổi."""
    from apps.dealers.models import DealerProfileStatus

    status = status_label(dealer.status)
    if dealer.status == DealerProfileStatus.ACTIVE:
        return (
            f"[Hồ sơ đại lý] {dealer.store_name} — {status}",
            f"Hồ sơ {dealer.store_name} đã được duyệt. Bạn có thể đặt hàng và đăng sản phẩm.",
            "success",
        )
    if dealer.status == DealerProfileStatus.REJECTED:
        return (
            f"[Hồ sơ đại lý] {dealer.store_name} — {status}",
            f"Hồ sơ {dealer.store_name} đã bị từ chối. Vui lòng kiểm tra giấy tờ.",
            "error",
        )
    return (
        f"[Hồ sơ đại lý] {dealer.store_name} — {status}",
        f"Trạng thái hồ sơ {dealer.store_name} đã cập nhật thành {status}.",
        "info",
    )


def supplier_verification_updated(supplier):
    """Trả (title, content, type) thông báo khi trạng thái xác minh hồ sơ NCC thay đổi."""
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


def purchase_order_status_updated(order, old_status=""):
    """Trả (title, content, type) khi trạng thái phiếu nhập thay đổi."""
    new_label = status_label(order.status)
    old_label = status_label(old_status) if old_status else ""
    if old_status and old_status != order.status:
        content = (
            f"Phiếu {order.order_code}: {old_label} → {new_label}."
        )
    else:
        content = f"Phiếu nhập {order.order_code} — {new_label}."

    if order.status == "completed":
        notif_type = "success"
    elif order.status in ("rejected", "cancelled", "returned", "return_rejected"):
        notif_type = "error"
    elif order.status in (
        "deposit_pending_verification",
        "final_payment_pending_verification",
        "pending_supplier_confirmation",
        "pending_dealer_confirmation",
        "return_requested",
    ):
        notif_type = "warning"
    else:
        notif_type = "info"

    return (
        f"[Phiếu nhập] {order.order_code} — {new_label}",
        content,
        notif_type,
    )


def customer_order_status_updated(order, old_status=""):
    """Trả (title, content, type) khi trạng thái đơn buyer thay đổi."""
    new_label = CUSTOMER_ORDER_STATUS_VI.get(order.status, status_label(order.status))
    old_label = (
        CUSTOMER_ORDER_STATUS_VI.get(old_status, status_label(old_status))
        if old_status
        else ""
    )
    if old_status and old_status != order.status:
        content = f"Đơn {order.order_code}: {old_label} → {new_label}."
    else:
        content = f"Đơn hàng {order.order_code} — {new_label}."

    if order.status == "completed":
        notif_type = "success"
    elif order.status in ("cancelled", "returned", "return_rejected"):
        notif_type = "error"
    elif order.status in ("pending", "return_requested", "cancel_requested"):
        notif_type = "warning"
    else:
        notif_type = "info"

    return (
        f"[Đơn hàng] {order.order_code} — {new_label}",
        content,
        notif_type,
    )

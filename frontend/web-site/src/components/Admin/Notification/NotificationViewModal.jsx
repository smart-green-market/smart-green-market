import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../../Supplier/Notification/Notification.css";
import NotificationReferenceModal from "./NotificationReferenceModal";
import { isSupportedReferenceType, normalizeReferenceType } from "./notificationReferenceHelpers";

const TYPE = {
    info: { label: "THÔNG BÁO" },
    warning: { label: "CẢNH BÁO" },
    success: { label: "THÀNH CÔNG" },
    error: { label: "THẤT BẠI" },
};

const TYPE_REF = {
    account_document: { label: "GIẤY TỜ - NHÀ CUNG CẤP" },
    supplier: { label: "NHÀ CUNG CẤP" },
    dealer: { label: "ĐẠI LÝ" },
    category: { label: "DANH MỤC - NHÀ CUNG CẤP" },
    certification: { label: "CHỨNG CHỈ - NHÀ CUNG CẤP" },
    supplier_product: { label: "SẢN PHẨM - NHÀ CUNG CẤP" },
    dealer_product: { label: "SẢN PHẨM - ĐẠI LÝ" },
    purchase_order: { label: "ĐƠN HÀNG - ĐẠI LÝ" },
};

const REFERENCE_ROUTES = {
    category: "/quan-tri/danh-muc",
    supplier_product: "/quan-tri/san-pham",
    supplier: "/quan-tri/nha-cung-cap",
    account_document: "/quan-tri/giay-to",
    certification: "/quan-tri/chung-chi",
};

const notifTone = (type) => {
    const tones = { warning: 'a', info: 'b', success: 'g', error: 'r' };
    return tones[type] || 'b';
};

const notifIcon = (referenceType) => {
    const icons = {
        purchase_order: 'ti-clipboard-list',
        supplier_product: 'ti-package',
        category: 'ti-tags',
        certification: 'ti-certificate',
        supplier: 'ti-users',
        dealer: 'ti-store',
        account_document: 'ti-file-text',
    };
    return icons[referenceType] || 'ti-bell';
};

const formatNotifDateTimeFull = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export default function NotificationViewModal({
    isOpen,
    onClose,
    notification,
    loading,
    canManageActions = false,
}) {
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);
    // Cache notification data so reference modal can stay open after notification view closes
    const [cachedNotification, setCachedNotification] = useState(null);
    const navigate = useNavigate();

    // When notification view opens with a new notification, update cache
    useEffect(() => {
        if (isOpen && notification) {
            setCachedNotification(notification);
        }
    }, [isOpen, notification]);

    // When notification view closes (not via quick handle), also close reference
    useEffect(() => {
        if (!isOpen && !referenceModalOpen) {
            setCachedNotification(null);
        }
    }, [isOpen, referenceModalOpen]);

    const handleGoToManagement = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        onClose();

        const n = cachedNotification || notification;
        if (!n) return;
        const type = normalizeReferenceType(n.referenceType);
        const route = REFERENCE_ROUTES[type];
        if (route) {
            navigate(route);
        }
    };

    const handleQuickHandle = () => {
        // Cache notification data before closing view
        setCachedNotification(notification);
        // Open reference modal first, then close notification view
        setReferenceModalOpen(true);
        onClose();
    };

    const handleCloseReference = () => {
        setReferenceModalOpen(false);
        setCachedNotification(null);
    };

    const handleClose = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        setReferenceModalOpen(false);
        setCachedNotification(null);
        onClose();
    };

    // Nothing to render if both are closed and no cached data
    if (!isOpen && !referenceModalOpen) return null;

    const n = (isOpen ? notification : cachedNotification) ?? cachedNotification;
    if (!n) return null;

    const typeConfig = TYPE[n.type] ?? TYPE.info;
    const refConfig = TYPE_REF[n.referenceType] ?? { label: "KHÁC" };
    const canViewReference =
        n.referenceId != null &&
        isSupportedReferenceType(n.referenceType);

    const metaRows = [];
    metaRows.push(['Loại thông báo', typeConfig.label]);
    metaRows.push(['Đối tượng', refConfig.label]);
    if (n.referenceOrderCode) {
        metaRows.push(['Mã tham chiếu', n.referenceOrderCode]);
    } else if (n.referenceId) {
        metaRows.push(['Mã tham chiếu', `#${n.referenceId}`]);
    }
    if (n.referenceStatus) {
        const statusLabels = {
            pending_dealer_confirmation: 'Chờ NCC xác nhận',
            confirmed: 'Đã xác nhận',
            delivered: 'Đã giao',
            completed: 'Hoàn thành',
            returned: 'Yêu cầu trả hàng',
            cancelled: 'Đã hủy',
            rejected: 'Từ chối',
        };
        metaRows.push(['Trạng thái', statusLabels[n.referenceStatus] || n.referenceStatus]);
    }

    return createPortal(
        <>
            {/* Notification view overlay — only shown when isOpen=true */}
            {isOpen && (
                <div
                    className="supplier-notif-root modal-overlay open"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleClose(e);
                    }}
                >
                    <div className="modal">
                        <div className="modal-head">
                            <div className={`notif-ico ${notifTone(n.type)}`}>
                                <i className={`ti ${notifIcon(n.referenceType)}`}></i>
                            </div>
                            <div className="modal-head-text">
                                <div className="modal-title">{n.title}</div>
                                <div className="modal-time">{formatNotifDateTimeFull(n.createdAt)}</div>
                            </div>
                            <button className="modal-close" onClick={handleClose}>
                                <i className="ti ti-x"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div>{n.content}</div>
                            {metaRows.length > 0 && (
                                <div className="modal-meta-box">
                                    {metaRows.map(([label, value]) => (
                                        <div className="modal-meta-row" key={label}>
                                            <span>{label}</span>
                                            <span>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-foot">
                            {canViewReference && (
                                <>
                                    <button
                                        className="btn-primary"
                                        onClick={handleQuickHandle}
                                        title="Đóng thông báo và mở chi tiết đối tượng để xử lý"
                                    >
                                        <i className="ti ti-eye"></i> Xử lý nhanh
                                    </button>
                                    <button
                                        className="btn-ghost"
                                        onClick={handleGoToManagement}
                                        title="Đi tới trang danh sách quản lý đối tượng"
                                    >
                                        <i className="ti ti-arrow-right"></i> Đi tới quản lý
                                    </button>
                                </>
                            )}
                            <button className="btn-ghost" onClick={handleClose}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reference modal — rendered independently, survives notification view close */}
            <NotificationReferenceModal
                isOpen={referenceModalOpen}
                onClose={handleCloseReference}
                referenceType={n.referenceType}
                referenceId={n.referenceId}
                canManageActions={canManageActions}
            />
        </>
        , document.body
    );
}


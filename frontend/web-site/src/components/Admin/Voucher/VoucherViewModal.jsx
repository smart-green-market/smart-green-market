import { useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";
import RejectModal from "../../common/RejectModal";
import DateField from "../../common/DateField";
import InfoField from "../../common/InfoField";
import { isVoucherPending } from "./voucherHelpers";

const formatCurrency = (val) => {
    if (val == null || isNaN(Number(val))) return "—";
    return new Intl.NumberFormat('vi-VN').format(Number(val)) + ' đ';
};

const formatDiscountValue = (voucher) => {
    const val = Number(voucher?.discount_value || 0);
    if (voucher?.discount_type === "percent") {
        return `${val}%`;
    }
    return formatCurrency(val);
};

export default function VoucherViewModal({
    isOpen,
    onClose,
    voucher,
    onApprove,
    onReject,
    onDelete,
    loading,
    error = "",
    closeOnAction = true,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [rejectConfig, setRejectConfig] = useState(null);

    if (!isOpen || !voucher) return null;

    const isPending = isVoucherPending(voucher.status);
    const isActive = voucher.status === "active";
    const isRejected = voucher.status === "rejected";

    const statusLabel = isPending
        ? "Chờ duyệt"
        : isActive
          ? "Đang hoạt động"
          : isRejected
            ? "Từ chối"
            : voucher.status;

    const statusClass = isPending
        ? "bg-amber-100 text-amber-800"
        : isActive
          ? "bg-green-100 text-green-800"
          : isRejected
            ? "bg-red-100 text-red-800"
            : "bg-neutral-100 text-neutral-700";

    const handleRejectConfirm = async (reason) => {
        if (rejectConfig?.action) {
            await rejectConfig.action(reason);
        }
        setRejectConfig(null);
        if (closeOnAction) {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (confirmConfig?.action) {
            await confirmConfig.action();
        }
        setConfirmConfig(null);
        if (closeOnAction) {
            onClose();
        }
    };

    const openConfirm = ({ title, message, confirmText, variant, action }) => {
        setConfirmConfig({ title, message, confirmText, variant, action });
    };

    const openReject = ({ title, message, action }) => {
        setRejectConfig({ title, message, action });
    };

    // Creator display helper
    const creatorDisplay = voucher.dealer
        ? (typeof voucher.dealer === "object" ? voucher.dealer.store_name || `Đại lý ID: ${voucher.dealer.id}` : `Đại lý ID: ${voucher.dealer}`)
        : "Hệ thống (Admin)";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-[700px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900">
                                    Chi tiết Voucher: {voucher.code}
                                </h2>
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusClass}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="cursor-pointer p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                        <div className="p-6 flex flex-col gap-5 font-['Geist',sans-serif]">
                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Mã Voucher" value={voucher.code} />
                                <InfoField label="Người tạo / Đại lý" value={creatorDisplay} />
                            </div>

                            <InfoField label="Tiêu đề" value={voucher.title} />
                            <InfoField label="Mô tả" value={voucher.description || "Không có mô tả"} />

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Loại giảm giá" value={voucher.discount_type === "percent" ? "Giảm theo phần trăm (%)" : "Giảm số tiền cố định (đ)"} />
                                <InfoField label="Giá trị giảm" value={formatDiscountValue(voucher)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Đơn hàng tối thiểu" value={formatCurrency(voucher.min_order_amount)} />
                                <InfoField label="Mức giảm tối đa" value={formatCurrency(voucher.max_discount_amount)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Tổng lượt sử dụng giới hạn" value={voucher.usage_limit != null && voucher.usage_limit < 2147483647 ? voucher.usage_limit : "Không giới hạn"} />
                                <InfoField label="Lượt dùng tối đa mỗi khách" value={voucher.usage_limit_per_customer != null && voucher.usage_limit_per_customer < 2147483647 ? voucher.usage_limit_per_customer : "Không giới hạn"} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <DateField label="Ngày bắt đầu" value={voucher.start_date} />
                                <DateField label="Ngày kết thúc" value={voucher.end_date} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <DateField label="Ngày tạo" value={voucher.created_at} />
                                <DateField label="Ngày cập nhật" value={voucher.updated_at} />
                            </div>

                            {voucher.status === "rejected" && (
                                <InfoField label="Lý do từ chối" value={voucher.reject_reason || "Không có lý do chi tiết"} />
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0 bg-neutral-50">
                        <div>
                        </div>

                        <div className="flex justify-end gap-3 flex-wrap">
                        {isPending && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openReject({
                                            title: "Từ chối duyệt Voucher",
                                            message: `Bạn có chắc chắn muốn từ chối duyệt mã voucher "${voucher.code}" không?`,
                                            action: (reason) => onReject(voucher, reason),
                                        })
                                    }
                                    className="cursor-pointer px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                                >
                                    Từ chối
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title: "Duyệt Voucher",
                                            message: `Bạn có chắc chắn muốn kích hoạt duyệt mã voucher "${voucher.code}" không?`,
                                            confirmText: "Duyệt",
                                            variant: "success",
                                            action: () => onApprove(voucher),
                                        })
                                    }
                                    className="cursor-pointer px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                                >
                                    Duyệt
                                </button>
                            </>
                        )}

                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="cursor-pointer px-5 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-xl text-sm font-semibold transition-colors"
                        >
                            Đóng
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig !== null}
                onClose={() => setConfirmConfig(null)}
                onConfirm={handleConfirm}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText}
                cancelText="Hủy"
                variant={confirmConfig?.variant}
            />

            <RejectModal
                isOpen={rejectConfig !== null}
                onClose={() => setRejectConfig(null)}
                onConfirm={handleRejectConfirm}
                title={rejectConfig?.title}
                message={rejectConfig?.message}
                loading={loading}
                reasonLabel="Lý do từ chối"
                reasonPlaceholder="Nhập lý do chi tiết..."
            />
        </>
    );
}

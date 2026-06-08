import { useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";

export default function SupplierViewModal({
    isOpen,
    onClose,
    supplier,
    onApprove,
    onReject,
    loading,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);

    if (!isOpen || !supplier) {
        return null;
    }

    // ─────────────────────────────────────────
    // LOGIC TRẠNG THÁI DUYỆT
    // ─────────────────────────────────────────
    const isPending = supplier.verification_status === "pending";
    const isApproved = supplier.verification_status === "approved";
    const isRejected = supplier.verification_status === "rejected";
    // ─────────────────────────────────────────
    // XỬ LÝ CONFIRM MODAL
    // ─────────────────────────────────────────
    const openConfirm = ({ title, message, confirmText, variant, action }) => {
        setConfirmConfig({ title, message, confirmText, variant, action });
    };

    const handleConfirm = async () => {
        if (confirmConfig?.action) {
            await confirmConfig.action();
        }
        setConfirmConfig(null);
        onClose();
    };

    return (
        <>
            {/* OVERLAY */}
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                {/* MODAL */}
                <div className="w-full max-w-[760px] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-neutral-200 flex flex-col">
                    {/* HEADER */}
                    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-end">
                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-neutral-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 flex flex-col gap-5">
                            {/* AVATAR */}
                            <div className="flex justify-center">
                                <img
                                    src={supplier.avatar || "https://placehold.co/120x120"}
                                    alt=""
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            </div>

                            <InfoField label="Họ và tên" value={supplier.full_name} />

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Email" value={supplier.email} />
                                <InfoField label="Số điện thoại" value={supplier.phone} />
                            </div>

                            <InfoField label="Tên công ty" value={supplier.company_name} />
                            <InfoField label="Địa chỉ" value={supplier.address} />
                            <InfoField label="Mã số thuế" value={supplier.tax_code} />
                            <InfoField label="Mô tả" value={supplier.description} />

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Trạng thái duyệt" value={supplier.verification_status} />
                                <InfoField label="Trạng thái tài khoản" value={supplier.account_status} />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER: CHỈ GIỮ LẠI DUYỆT VÀ TỪ CHỐI */}
                    <div className="px-6 py-4 border-t border-neutral-200 flex justify-center gap-3 flex-wrap">
                        
                        {/* 1. KHI ĐANG CHỜ DUYỆT (PENDING): Hiện cả 2 nút Duyệt & Từ chối */}
                        {isPending && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() => openConfirm({
                                        title: "Duyệt nhà cung cấp",
                                        message: `Bạn có chắc chắn muốn duyệt "${supplier.company_name || supplier.full_name}"?`,
                                        confirmText: "Duyệt",
                                        variant: "success",
                                        action: () => onApprove(supplier),
                                    })}
                                    className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold"
                                >
                                    Duyệt
                                </button>

                                <button
                                    disabled={loading}
                                    onClick={() => openConfirm({
                                        title: "Từ chối nhà cung cấp",
                                        message: `Bạn có chắc chắn muốn từ chối "${supplier.company_name || supplier.full_name}"?`,
                                        confirmText: "Từ chối",
                                        variant: "danger",
                                        action: () => onReject(supplier),
                                    })}
                                    className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold"
                                >
                                    Từ chối
                                </button>
                            </>
                        )}

                        {/* 2. KHI ĐÃ DUYỆT RỒI (APPROVED): Chỉ hiện duy nhất nút Từ chối */}
                        {isApproved && (
                            <button
                                disabled={loading}
                                onClick={() => openConfirm({
                                    title: "Hủy duyệt / Từ chối",
                                    message: `Bạn muốn chuyển trạng thái của "${supplier.company_name || supplier.full_name}" thành Từ chối?`,
                                    confirmText: "Từ chối",
                                    variant: "danger",
                                    action: () => onReject(supplier), // Gọi chính xác hàm Từ Chối lên trang cha
                                })}
                                className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold"
                            >
                                Từ chối nhà cung cấp
                            </button>
                        )}

                        {isRejected && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() => openConfirm({
                                        title: "Duyệt nhà cung cấp",
                                        message: `Bạn có chắc chắn muốn duyệt "${supplier.company_name || supplier.full_name}"?`,
                                        confirmText: "Duyệt",
                                        variant: "success",
                                        action: () => onApprove(supplier),
                                    })}
                                    className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold"
                                >
                                    Duyệt
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CONFIRM MODAL */}
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
        </>
    );
}

// COMPONENTS CON GIỮ NGUYÊN
function InfoField({ label, value }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {label}
            </label>
            <div className="px-4 py-3 rounded-xl border border-neutral-200 bg-stone-100 text-sm">
                {value || "-"}
            </div>
        </div>
    );
}
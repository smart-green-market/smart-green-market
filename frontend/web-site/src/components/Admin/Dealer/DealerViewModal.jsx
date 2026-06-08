import { useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";

export default function DealerViewModal({
    isOpen,
    onClose,
    dealer,
    onApprove,
    onReject,
    onLock,
    onUnlock,
    onBan,
    loading,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);

    if (!isOpen || !dealer) return null;

    const isPending = dealer.verify === "pending";

    const isActive = dealer.verify === "active";

    const isInactive = dealer.verify === "inactive";

    const isBanned = dealer.verify === "banned";

    const openConfirm = ({
        title,
        message,
        confirmText,
        variant,
        action,
    }) => {
        setConfirmConfig({
            title,
            message,
            confirmText,
            variant,
            action,
        });
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

                {/* MODAL */}
                <div className="w-full max-w-[760px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">

                    {/* HEADER */}
                    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
                    <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                Danh mục sản phẩm
                            </h2>
                        </div>
                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">

                        <div className="p-6 flex flex-col gap-6">

                            {/* AVATAR */}
                            <div className="flex flex-col items-center justify-center">

                                <img
                                    src={
                                        dealer.avatar
                                    }
                                    alt=""
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            </div>

                            {/* HỌ + TÊN */}
                            <div className="grid grid-cols-2 gap-4">

                                <InfoField
                                    label="Họ"
                                    value={
                                        dealer.first_name
                                    }
                                />

                                <InfoField
                                    label="Tên"
                                    value={
                                        dealer.last_name
                                    }
                                />
                            </div>

                            {/* FULL NAME */}
                            <InfoField
                                label="Họ và tên"
                                value={
                                    dealer.full_name
                                }
                            />

                            {/* EMAIL + PHONE */}
                            <div className="grid grid-cols-2 gap-4">

                                <InfoField
                                    label="Email"
                                    value={
                                        dealer.email
                                    }
                                />

                                <InfoField
                                    label="Số điện thoại"
                                    value={
                                        dealer.phone
                                    }
                                />
                            </div>

                            {/* COMPANY */}
                            <InfoField
                                label="Tên công ty"
                                value={
                                    dealer.company_name
                                }
                            />

                            {/* ADDRESS */}
                            <InfoField
                                label="Địa chỉ"
                                value={
                                    dealer.address
                                }
                            />

                            {/* TAX */}
                            <InfoField
                                label="Mã số thuế / CCCD"
                                value={
                                    dealer.tax_code
                                }
                            />

                            {/* EMAIL + PHONE */}
                            <div className="grid grid-cols-2 gap-4">

                                <InfoField
                                    label="Ngày đăng ký"
                                    value={
                                        dealer.created_at
                                    }
                                />

                                <InfoField
                                    label="Được duyệt"
                                    value={
                                        dealer.updated_at
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-4 border-t border-neutral-200 flex justify-center gap-3 shrink-0 flex-wrap bg-white">

                        {isPending && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title:
                                                "Duyệt nhà cung cấp",
                                            message: `Bạn có chắc chắn muốn duyệt "${dealer.full_name}" không?`,
                                            confirmText:
                                                "Duyệt",
                                            variant:
                                                "warning",
                                            action: () =>
                                                onApprove(
                                                    dealer
                                                ),
                                        })
                                    }
                                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-sm font-semibold"
                                >
                                    Duyệt
                                </button>

                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title:
                                                "Từ chối nhà cung cấp",
                                            message: `Bạn có chắc chắn muốn từ chối "${dealer.full_name}" không?`,
                                            confirmText:
                                                "Từ chối",
                                            variant:
                                                "danger",
                                            action: () =>
                                                onReject(
                                                    dealer
                                                ),
                                        })
                                    }
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm font-semibold"
                                >
                                    Từ chối
                                </button>
                            </>
                        )}

                        {isActive && (
                            <button
                                disabled={loading}
                                onClick={() =>
                                    openConfirm({
                                        title:
                                            "Tạm khóa",
                                        message: `Tạm khóa "${dealer.full_name}" ?`,
                                        confirmText:
                                            "Tạm khóa",
                                        variant:
                                            "warning",
                                        action: () =>
                                            onLock(
                                                dealer
                                            ),
                                    })
                                }
                                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg"
                            >
                                Tạm khóa
                            </button>
                        )}

                        {isInactive && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title:
                                                "Mở khóa",
                                            message: `Mở khóa "${dealer.full_name}" ?`,
                                            confirmText:
                                                "Mở khóa",
                                            variant:
                                                "success",
                                            action: () =>
                                                onUnlock(
                                                    dealer
                                                ),
                                        })
                                    }
                                    className="px-6 py-2.5 bg-green-500 text-white rounded-lg"
                                >
                                    Mở khóa
                                </button>

                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title:
                                                "Vô hiệu hóa",
                                            message: `Vô hiệu hóa "${dealer.full_name}" ?`,
                                            confirmText:
                                                "Vô hiệu hóa",
                                            variant:
                                                "danger",
                                            action: () =>
                                                onBan(
                                                    dealer
                                                ),
                                        })
                                    }
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg"
                                >
                                    Vô hiệu hóa
                                </button>
                            </>
                        )}

                        {isBanned && (
                            <button
                                disabled={loading}
                                onClick={() =>
                                    openConfirm({
                                        title:
                                            "Mở khóa",
                                        message: `Mở khóa "${dealer.full_name}" ?`,
                                        confirmText:
                                            "Mở khóa",
                                        variant:
                                            "success",
                                        action: () =>
                                            onUnlock(
                                                dealer
                                            ),
                                    })
                                }
                                className="px-6 py-2.5 bg-green-500 text-white rounded-lg"
                            >
                                Mở khóa
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* CONFIRM */}
            <ConfirmModal
                isOpen={confirmConfig !== null}
                onClose={() =>
                    setConfirmConfig(null)
                }
                onConfirm={handleConfirm}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={
                    confirmConfig?.confirmText
                }
                cancelText="Hủy"
                variant={confirmConfig?.variant}
            />
        </>
    );
}

function InfoField({ label, value }) {
    return (
        <div className="flex flex-col gap-1">

            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {label}
            </label>

            <div className="px-4 py-3 rounded-xl border border-neutral-200 bg-stone-100 text-sm">
                {value || "-"}
            </div>
        </div>
    );
}
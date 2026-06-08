import { useState } from "react";

import { X } from "lucide-react";

import ConfirmModal from "../../common/ConfirmModal";

export default function CategoryViewModal({
    isOpen,
    onClose,
    category,
    onApprove,
    onReject,
    onLock,
    onUnlock,
    loading,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);

    if (!isOpen || !category) return null;

    const isPending = category.status === "pending";

    const isActive = category.status === "active";

    const isInactive = category.status === "inactive";

    // ── OPEN CONFIRM ─────────────────────
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

    // ── HANDLE CONFIRM ───────────────────
    const handleConfirm =
        async () => {
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
                <div className="w-full max-w-[620px] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-neutral-200 flex justify-end">
                    <button
                        disabled={loading}
                        onClick={onClose}
                        className="cursor-pointer p-2 rounded-full hover:bg-neutral-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                    {/* BODY */}
                    <div className="p-6 flex flex-col gap-5">

                        <InfoField
                            label="Tên danh mục"
                            value={
                                category.name
                            }
                        />

                        <InfoField
                            label="Mô tả"
                            value={
                                category.description
                            }
                        />

                        <InfoField
                            label="Trạng thái"
                            value={
                                category.status
                            }
                        />

                        <InfoField
                            label="Ngày tạo"
                            value={
                                category.created_at
                            }
                        />

                        <InfoField
                            label="Ngày duyệt"
                            value={
                                category.verified_at
                            }
                        />
                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-4 border-t border-neutral-200 flex justify-center gap-3 flex-wrap">

                        {/* PENDING */}
                        {isPending && (
                            <>
                                <button
                                    onClick={() =>
                                        openConfirm(
                                            {
                                                title:
                                                    "Duyệt danh mục",

                                                message: `Bạn có chắc chắn muốn duyệt "${category.name}" không?`,

                                                confirmText:
                                                    "Duyệt",

                                                variant:
                                                    "success",

                                                action:
                                                    () =>
                                                        onApprove(
                                                            category
                                                        ),
                                            }
                                        )
                                    }
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors"
                                >
                                    Duyệt
                                </button>

                                <button
                                    onClick={() =>
                                        openConfirm(
                                            {
                                                title:
                                                    "Từ chối danh mục",

                                                message: `Bạn có chắc chắn muốn từ chối "${category.name}" không?`,

                                                confirmText:
                                                    "Từ chối",

                                                variant:
                                                    "danger",

                                                action:
                                                    () =>
                                                        onReject(
                                                            category
                                                        ),
                                            }
                                        )
                                    }
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-semibold transition-colors"
                                >
                                    Từ chối
                                </button>
                            </>
                        )}

                        {/* ACTIVE */}
                        {isActive && (
                            <button
                                onClick={() =>
                                    openConfirm(
                                        {
                                            title:
                                                "Khóa danh mục",

                                            message: `Bạn có chắc chắn muốn khóa "${category.name}" không?`,

                                            confirmText:
                                                "Khóa",

                                            variant:
                                                "warning",

                                            action:
                                                () =>
                                                    onLock(
                                                        category
                                                    ),
                                        }
                                    )
                                }
                                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold transition-colors"
                            >
                                Khóa
                            </button>
                        )}

                        {/* LOCKED */}
                        {isInactive && (
                            <button
                                onClick={() =>
                                    openConfirm(
                                        {
                                            title:
                                                "Mở khóa danh mục",

                                            message: `Bạn có chắc chắn muốn mở khóa "${category.name}" không?`,

                                            confirmText:
                                                "Mở khóa",

                                            variant:
                                                "success",

                                            action:
                                                () =>
                                                    onUnlock(
                                                        category
                                                    ),
                                        }
                                    )
                                }
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors"
                            >
                                Mở khóa
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CONFIRM */}
            <ConfirmModal
                isOpen={
                    confirmConfig !==
                    null
                }
                onClose={() =>
                    setConfirmConfig(
                        null
                    )
                }
                onConfirm={
                    handleConfirm
                }
                title={
                    confirmConfig?.title
                }
                message={
                    confirmConfig?.message
                }
                confirmText={
                    confirmConfig?.confirmText
                }
                cancelText="Hủy"
                variant={
                    confirmConfig?.variant
                }
            />
        </>
    );
}

function InfoField({
    label,
    value,
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {label}
            </label>

            <div className="px-4 py-3 rounded-xl border border-neutral-200 bg-stone-100 text-sm text-neutral-800">
                {value || "-"}
            </div>
        </div>
    );
}
import { useState } from "react";
import { X, CalendarDays } from "lucide-react";

import ConfirmModal from "../../common/ConfirmModal";

export default function CertificationViewModal({
    isOpen,
    onClose,
    certification,
    onApprove,
    onReject,
}) {
    const [confirmConfig, setConfirmConfig] =
        useState(null);

    if (!isOpen || !certification)
        return null;

    const isPending =
        certification.status ===
        "pending";

    const isActive =
        certification.status ===
        "active";

    const isRejected =
        certification.status ===
        "rejected";

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

    const handleConfirm =
        async () => {
            if (
                confirmConfig?.action
            ) {
                await confirmConfig.action();
            }

            setConfirmConfig(null);
            onClose();
        };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">

                {/* Modal */}
                <div className="w-full max-w-[896px] max-h-[90vh] bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden flex flex-col">

                    {/* Header */}
                    <div className="px-8 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">

                        <h2 className="text-xl font-semibold text-zinc-900">
                            Chi tiết chứng chỉ "{certification.name}"
                        </h2>

                        <button
                            onClick={
                                onClose
                            }
                            className="cursor-pointer p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-900" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                        
                        <div className="p-6 flex flex-col gap-5">
                            {/* Grid 1 */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                    label="Mã chứng chỉ"
                                    value={certification.code}
                                    mono
                                />
                                <InfoField
                                    label="Nhà cung cấp"
                                    value={certification.supplier?.company_name}
                                />
                            </div>

                            {/* Grid 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                <DateField
                                    label="Ngày cấp"
                                    value={certification.issueDate}
                                />
                                <DateField
                                    label="Ngày hết hạn"
                                    value={certification.expiryDate}
                                    danger
                                />
                            </div>

                            {/* Grid 3 */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                    label="Cơ quan cấp"
                                    value={certification.issuedBy}
                                />
                                <InfoField
                                    label="Ngày duyệt chứng chỉ"
                                    value={certification.verifiedAt}
                                />
                            </div>

                            {/* IMAGE */}
                            <div className="w-full rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
                                <img
                                    src={certification.images?.[0]?.image_url}
                                    alt=""
                                    className="w-full object-contain"
                                />
                            </div>

                            {/* Description */}
                            <TextAreaField
                                label="Mô tả chi tiết"
                                value={certification.description}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-neutral-200 flex justify-end gap-4 shrink-0 bg-white">

                        {/* PENDING */}
                        {isPending && (
                            <>
                                <button
                                    onClick={() =>
                                        openConfirm(
                                            {
                                                title:
                                                    "Từ chối chứng chỉ",
                                                message: `Bạn có chắc chắn muốn xóa chứng chỉ "${certification.name}" không?`,
                                                confirmText:
                                                    "Xóa",
                                                variant:
                                                    "danger",
                                                action:
                                                    () =>
                                                        onReject(
                                                            certification
                                                        ),
                                            }
                                        )
                                    }
                                    className="cursor-pointer px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white text-base font-bold rounded-lg transition-colors"
                                >
                                    Từ chối
                                </button>

                                <button
                                    onClick={() =>
                                        openConfirm(
                                            {
                                                title:
                                                    "Duyệt chứng chỉ",
                                                message: `Bạn có chắc chắn muốn duyệt chứng chỉ "${certification.name}" không?`,
                                                confirmText:
                                                    "Duyệt",
                                                variant:
                                                    "warning",
                                                action:
                                                    () =>
                                                        onApprove(
                                                            certification
                                                        ),
                                            }
                                        )
                                    }
                                    className="cursor-pointer px-8 py-2.5 bg-green-700 hover:bg-green-600 text-white text-base font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    Duyệt
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
                                                "Từ chối chứng chỉ",
                                            message: `Bạn có chắc chắn muốn từ chối chứng chỉ "${certification.name}" không?`,
                                            confirmText:
                                                "Từ chối",
                                            variant:
                                                "danger",
                                            action:
                                                () =>
                                                    onReject(
                                                        certification
                                                    ),
                                        }
                                    )
                                }
                                className="cursor-pointer px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white text-base font-bold rounded-lg transition-colors"
                            >
                                Từ chối
                            </button>
                        )}

                        {/* REJECTED */}
                        {isRejected && (
                            <button
                                onClick={() =>
                                    openConfirm(
                                        {
                                            title:
                                                "Duyệt lại chứng chỉ",
                                            message: `Bạn có chắc chắn muốn duyệt lại chứng chỉ "${certification.name}" không?`,
                                            confirmText:
                                                "Duyệt",
                                            variant:
                                                "warning",
                                            action:
                                                () =>
                                                    onApprove(
                                                        certification
                                                    ),
                                        }
                                    )
                                }
                                className="cursor-pointer px-8 py-2.5 bg-green-700 hover:bg-green-600 text-white text-base font-bold rounded-lg transition-colors shadow-sm"
                            >
                                Duyệt
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
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
    mono,
    serif,
}) {
    return (
        <div className="flex flex-col gap-1">

            <label className="text-neutral-700 text-base">
                {label}
            </label>

            <div className="px-4 py-2.5 rounded-lg border border-neutral-200 bg-stone-100">

                <span
                    className={`
                        text-zinc-900 text-base
                        ${
                            mono
                                ? "font-mono"
                                : ""
                        }
                        ${
                            serif
                                ? "font-serif"
                                : ""
                        }
                    `}
                >
                    {value || "-"}
                </span>
            </div>
        </div>
    );
}

function DateField({
    label,
    value,
    danger,
}) {
    return (
        <div className="flex flex-col gap-1">

            <label className="text-neutral-700 text-base">
                {label}
            </label>

            <div className="px-4 py-2.5 rounded-lg border border-neutral-200 flex items-center gap-2">

                <CalendarDays
                    className={`w-4 h-4 ${
                        danger
                            ? "text-red-700"
                            : "text-neutral-700"
                    }`}
                />

                <span
                    className={`text-base ${
                        danger
                            ? "text-red-700 font-bold"
                            : "text-zinc-900"
                    }`}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

function TextAreaField({
    label,
    value,
}) {
    return (
        <div className="flex flex-col gap-1">

            <label className="text-neutral-700 text-base">
                {label}
            </label>

            <div className="min-h-24 px-4 py-3 rounded-lg border border-neutral-200">

                <p className="text-zinc-900 text-base whitespace-pre-line">
                    {value || "-"}
                </p>
            </div>
        </div>
    );
}

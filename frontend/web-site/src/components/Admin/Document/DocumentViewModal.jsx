import { useState } from "react";
import { X } from "lucide-react";

import ConfirmModal from "../../common/ConfirmModal";

const DOCUMENT_TYPE_LABELS = {
    business_license:
        "Giấy phép kinh doanh",

    id_card: "CCCD / CMND",

    tax_certificate:
        "Giấy chứng nhận thuế",
};

export default function DocumentViewModal({
    isOpen,
    onClose,
    document,
    onApprove,
    onReject,
}) {
    const [confirmType, setConfirmType] =
        useState(null);

    if (!isOpen || !document) return null;

    const isPending =
        document.status === "pending";

    const handleApprove = async () => {
        await onApprove(document);

        onClose();
    };

    const handleReject = async () => {
        await onReject(document);

        onClose();
    };

    return (
        <>
            {/* OVERLAY */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

                {/* MODAL */}
                <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">

                    {/* HEADER */}
                    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">

                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                {
                                    DOCUMENT_TYPE_LABELS[
                                        document.document_type
                                    ]
                                }
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="cursor-pointer p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* BODY SCROLL */}
                    <div className="
                        flex-1
                        overflow-y-auto
                        scrollbar-thin
                        scrollbar-thumb-neutral-300
                        scrollbar-track-transparent
                    ">

                        <div className="p-6">

                            {/* INFO */}
                            <div className="mb-5">
                                <InfoField
                                    label="Nhà cung cấp"
                                    value={
                                        document.supplier?.company_name
                                    }
                                />
                            </div>

                            {/* IMAGE */}
                            <div className="w-full rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">

                                <img
                                    src={
                                        document.file_url
                                    }
                                    alt=""
                                    className="w-full object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    {isPending && (
                        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 shrink-0">

                            <button
                                onClick={() =>
                                    setConfirmType(
                                        "reject"
                                    )
                                }
                                className="cursor-pointer px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors"
                            >
                                Từ chối
                            </button>

                            <button
                                onClick={() =>
                                    setConfirmType(
                                        "approve"
                                    )
                                }
                                className="cursor-pointer px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors"
                            >
                                Duyệt
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* APPROVE */}
            <ConfirmModal
                isOpen={
                    confirmType === "approve"
                }
                onClose={() =>
                    setConfirmType(null)
                }
                onConfirm={handleApprove}
                title="Duyệt giấy tờ"
                message={`Bạn có chắc chắn muốn duyệt giấy tờ này không?`}
                confirmText="Duyệt"
                cancelText="Hủy"
                variant="success"
            />

            {/* REJECT */}
            <ConfirmModal
                isOpen={
                    confirmType === "reject"
                }
                onClose={() =>
                    setConfirmType(null)
                }
                onConfirm={handleReject}
                title="Từ chối giấy tờ"
                message={`Bạn có chắc chắn muốn từ chối giấy tờ này không?`}
                confirmText="Từ chối"
                cancelText="Hủy"
                variant="danger"
            />
        </>
    );
}

function InfoField({ label, value }) {
    return (
        <div className="flex flex-col gap-2">

            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {label}
            </label>

            <div className="px-4 py-3 rounded-xl border border-neutral-200 bg-stone-100 text-sm">
                {value || "-"}
            </div>
        </div>
    );
}
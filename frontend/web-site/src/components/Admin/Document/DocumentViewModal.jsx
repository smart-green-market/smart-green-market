import { useState } from "react";
import { X } from "lucide-react";

import ConfirmModal from "../../common/ConfirmModal";
import RejectModal from "../../common/RejectModal";
import DateField from "../../common/DateField";
import InfoField from "../../common/InfoField";

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
    const [showRejectModal, setShowRejectModal] = useState(false);

    if (!isOpen || !document) return null;

    const isPending = document.status === "pending";
    const isApprove = document.status === "approved";
    const isRejected = document.status === "rejected";

    const handleApprove = async () => {
        await onApprove(document);

        onClose();
    };

    const handleReject = async (reason) => {
        await onReject(document, reason);
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
                            
                            <div className="mt-5">
                                <div className="grid grid-cols-2 gap-4">
                                <DateField label="Ngày đăng ký" value={document.created_at} />
                                <DateField label="Ngày được duyệt" value={document?.verified_at} />
                            </div>
                        </div>
                                                    </div>

                    </div>

                    {/* FOOTER */}
                    {isPending && (
                        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 shrink-0">

                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="cursor-pointer px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold"
                            >
                                Từ chối
                            </button>

                            <button
                                onClick={() =>
                                    setConfirmType(
                                        "approve"
                                    )
                                }
                                className="cursor-pointer px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
                            >
                                Duyệt
                            </button>
                        </div>
                    )}
                    {isApprove && (
                        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="cursor-pointer px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold"
                            >
                                Từ chối
                            </button>
                        </div>
                    )}
                    {isRejected && (
                        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() =>
                                    setConfirmType(
                                        "approve"
                                    )
                                }
                                className="cursor-pointer px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
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

            <RejectModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                title="Từ chối giấy tờ"
                message="Bạn có chắc chắn muốn từ chối giấy tờ này không?"
            />
        </>
    );
}

import { useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";
import RejectModal from "../../common/RejectModal";
import DateField from "../../common/DateField";
import { appToast } from "../../common/toast";
import { getDealerDisplayStatus } from "./DealerFilter";
import { getDealerApprovalDocumentError } from "./dealerDocumentHelpers";

export default function DealerViewModal({
    isOpen,
    onClose,
    dealer,
    onApprove,
    onReject,
    onLock,
    onUnlock,
    loading,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [rejectConfig, setRejectConfig] = useState(null);

    if (!isOpen || !dealer) return null;

    const displayStatus = getDealerDisplayStatus({
        status: dealer.status,
        account_status: dealer.account?.status,
        account: dealer.account,
    });

    const isPending = displayStatus === "pending";
    const isActive = displayStatus === "active";
    const isInactive = displayStatus === "inactive";
    //const isRejected = displayStatus === "rejected";

    const dealerName =
        dealer.account?.full_name || dealer.store_name || "đại lý này";

    const openReject = ({ title, message, action }) => {
        setRejectConfig({ title, message, action });
    };

    const handleRejectConfirm = async (reason) => {
        if (rejectConfig?.action) {
            await rejectConfig.action(reason);
        }
        setRejectConfig(null);
        onClose();
    };

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

    const docError = getDealerApprovalDocumentError(dealer.documents);

    const openApproveConfirm = (title) => {
        if (docError) {
            appToast.warning(docError);
            return;
        }

        openConfirm({
            title,
            message: `Bạn có chắc chắn muốn duyệt "${dealer.store_name}" không?`,
            confirmText: "Duyệt",
            variant: "success",
            action: () => onApprove(dealer),
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-[760px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                Thông tin đại lý "{dealer.store_name}"
                            </h2>
                        </div>
                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="cursor-pointer p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex flex-col items-center justify-center">
                                <img
                                    src={dealer.account?.avatar_url}
                                    alt=""
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            </div>

                            <InfoField
                                label="Họ và tên"
                                value={dealer.account?.full_name}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                    label="Email"
                                    value={dealer.account?.email}
                                />

                                <InfoField
                                    label="Số điện thoại"
                                    value={dealer.account?.phone}
                                />
                            </div>

                            <InfoField
                                label="Tên cửa hàng"
                                value={dealer.store_name}
                            />

                            <InfoField
                                label="Địa chỉ"
                                value={dealer.store_address}
                            />

                            <InfoField
                                label="Mô tả"
                                value={dealer.description}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <DateField
                                    label="Ngày đăng ký"
                                    value={dealer.created_at}
                                />

                                <DateField
                                    label="Ngày cập nhật"
                                    value={dealer.updated_at}
                                />
                            </div>

                            {dealer.rejection_reason ? (
                                <InfoField
                                    label="Lý do từ chối"
                                    value={dealer.rejection_reason}
                                />
                            ) : null}

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    Giấy tờ
                                </label>
                                {dealer.documents?.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {dealer.documents.map((doc) => (
                                            <DocumentStatusRow key={doc.id} doc={doc} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Chưa upload đủ giấy tờ
                                    </div>
                                )}
                                {docError ? (
                                    <p className="text-xs text-amber-700">{docError}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-neutral-200 flex justify-center gap-3 shrink-0 flex-wrap bg-white">
                        {isPending && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() => openApproveConfirm("Duyệt đại lý")}
                                    className="cursor-pointer px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                                >
                                    Duyệt
                                </button>

                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openReject({
                                            title: "Từ chối đại lý",
                                            message: `Bạn có chắc chắn muốn từ chối "${dealer.store_name}" không?`,
                                            action: (reason) =>
                                                onReject(dealer, reason),
                                        })
                                    }
                                    className="cursor-pointer px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
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
                                        title: "Tạm khóa đại lý",
                                        message: `Bạn có chắc chắn muốn tạm khóa "${dealer.store_name}" không?`,
                                        confirmText: "Tạm khóa",
                                        variant: "warning",
                                        action: (reason) => onLock(dealer, reason),
                                    })
                                }
                                className="cursor-pointer px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                            >
                                Tạm khóa
                            </button>
                        )}

                        {isInactive && (
                            <button
                                disabled={loading}
                                onClick={() =>
                                    openConfirm({
                                        title: "Mở khóa đại lý",
                                        message: `Bạn có chắc chắn muốn mở khóa đại lý "${dealer.store_name}" không?`,
                                        confirmText: "Mở khóa",
                                        variant: "success",
                                        action: () => onUnlock(dealer),
                                    })
                                }
                                className="cursor-pointer px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                            >
                                Mở khóa
                            </button>
                        )}

                        {/* {isRejected && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() => openApproveConfirm("Duyệt lại đại lý")}
                                    className="cursor-pointer px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                                >
                                    Duyệt
                                </button>
                            </>
                        )} */}
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

const DOC_STATUS_STYLE = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-800",
};

function DocumentStatusRow({ doc }) {
    const style = DOC_STATUS_STYLE[doc.status] ?? DOC_STATUS_STYLE.pending;

    return (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-stone-50 px-4 py-2.5 text-sm">
            <span className="font-medium text-neutral-800">
                {doc.document_type_label || doc.document_type}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${style}`}>
                {doc.status === "approved"
                    ? "Đã duyệt"
                    : doc.status === "rejected"
                      ? "Từ chối"
                      : "Chờ duyệt"}
            </span>
        </div>
    );
}

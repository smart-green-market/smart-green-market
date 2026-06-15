import { useState } from "react";
import { X, Bell, ExternalLink } from "lucide-react";
import DateField from "../../common/DateField";
import NotificationReferenceModal from "./NotificationReferenceModal";
import { isSupportedReferenceType } from "./notificationReferenceHelpers";

const TYPE = {
    info: {
        label: "THÔNG BÁO",
        bg: "bg-blue-100",
        text: "text-blue-700",
    },
    warning: {
        label: "CẢNH BÁO",
        bg: "bg-amber-100",
        text: "text-amber-700",
    },
    success: {
        label: "THÀNH CÔNG",
        bg: "bg-green-100",
        text: "text-green-700",
    },
    error: {
        label: "THẤT BẠI",
        bg: "bg-red-100",
        text: "text-red-700",
    },
};

const TYPE_REF = {
    supplier_document: {
        label: "GIẤY TỜ - NHÀ CUNG CẤP",
    },
    supplier_product: {
        label: "SẢN PHẨM - NHÀ CUNG CẤP",
    },
    supplier: {
        label: "NHÀ CUNG CẤP",
    },
    category: {
        label: "DANH MỤC - NHÀ CUNG CẤP",
    },
    certification: {
        label: "CHỨNG CHỈ - NHÀ CUNG CẤP",
    },
};

export default function NotificationViewModal({
    isOpen,
    onClose,
    notification,
    loading,
    canManageActions = false,
}) {
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);

    if (!isOpen || !notification) return null;

    const typeConfig = TYPE[notification.type] ?? TYPE.info;
    const refConfig = TYPE_REF[notification.referenceType] ?? { label: "KHÁC" };
    const canViewReference =
        notification.referenceId != null &&
        isSupportedReferenceType(notification.referenceType);

    const handleClose = () => {
        setReferenceModalOpen(false);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                <div className="flex max-h-[90vh] w-full max-w-[896px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                                <Bell className="h-5 w-5 text-zinc-700" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-zinc-900">
                                    Chi tiết thông báo
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    Xem nội dung thông báo hệ thống
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleClose}
                            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-neutral-100"
                        >
                            <X className="h-5 w-5 text-zinc-900" />
                        </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 pb-7 pt-8 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                        <InfoField label="Tiêu đề" value={notification.title} />

                        <div className="grid grid-cols-2 gap-6">
                            <BadgeField
                                label="Loại thông báo"
                                value={typeConfig.label}
                                bg={typeConfig.bg}
                                text={typeConfig.text}
                            />
                            <BadgeField
                                label="Đối tượng"
                                value={refConfig.label}
                                bg="bg-stone-100"
                                text="text-zinc-700"
                            />
                        </div>

                        <DateField
                            label="Ngày tạo thông báo"
                            value={notification.createdAt}
                        />

                        <TextAreaField label="Nội dung" value={notification.content} />
                    </div>

                    <div className="flex shrink-0 justify-end gap-3 border-t border-neutral-200 bg-white px-8 py-5">
                        {canViewReference && (
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setReferenceModalOpen(true)}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-800 px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-teal-900 disabled:opacity-60"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Xem chi tiết
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleClose}
                            className="cursor-pointer rounded-lg bg-zinc-900 px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            <NotificationReferenceModal
                isOpen={referenceModalOpen}
                onClose={() => setReferenceModalOpen(false)}
                referenceType={notification.referenceType}
                referenceId={notification.referenceId}
                canManageActions={canManageActions}
            />
        </>
    );
}

function InfoField({ label, value, mono, serif }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-base text-neutral-700">{label}</label>
            <div className="rounded-lg border border-neutral-200 bg-stone-100 px-4 py-2.5">
                <span
                    className={`text-base text-zinc-900 ${mono ? "font-mono" : ""} ${
                        serif ? "font-serif" : ""
                    }`}
                >
                    {value || "-"}
                </span>
            </div>
        </div>
    );
}

function BadgeField({ label, value, bg, text }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-base text-neutral-700">{label}</label>
            <div className="rounded-lg border border-neutral-200 px-4 py-3">
                <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${bg} ${text}`}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

function TextAreaField({ label, value }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-base text-neutral-700">{label}</label>
            <div className="min-h-28 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <p className="whitespace-pre-line text-base leading-relaxed text-zinc-900">
                    {value || "-"}
                </p>
            </div>
        </div>
    );
}

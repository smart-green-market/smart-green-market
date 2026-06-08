import { X, Bell, CalendarDays } from "lucide-react";

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
        label: "GIẤY TỜ",
    },

    supplier: {
        label: "NHÀ CUNG CẤP",
    },

    category: {
        label: "DANH MỤC",
    },

    certification: {
        label: "CHỨNG CHỈ",
    },
};

export default function NotificationViewModal({
    isOpen,
    onClose,
    notification,
    loading,
}) {

    if (!isOpen || !notification)
        return null;

    const typeConfig =
        TYPE[notification.type] ??
        TYPE.info;

    const refConfig =
        TYPE_REF[
            notification.referenceType
        ] ?? {
            label: "KHÁC",
        };

    return (
        <>
            {/* OVERLAY */}
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">

                {/* MODAL */}
                <div className="w-full max-w-[896px] max-h-[90vh] bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden flex flex-col">

                    {/* HEADER */}
                    <div className="px-8 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">

                        <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-zinc-700" />
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
                            disabled={loading}
                            onClick={onClose}
                            className="cursor-pointer p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-900" />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 overflow-y-auto px-8 pt-8 pb-7 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">

                        {/* TITLE */}
                        <InfoField
                            label="Tiêu đề"
                            value={
                                notification.title
                            }
                        />

                        {/* TYPE */}
                        <div className="grid grid-cols-2 gap-6">

                            <BadgeField
                                label="Loại thông báo"
                                value={
                                    typeConfig.label
                                }
                                bg={
                                    typeConfig.bg
                                }
                                text={
                                    typeConfig.text
                                }
                            />

                            <BadgeField
                                label="Đối tượng tham chiếu"
                                value={
                                    refConfig.label
                                }
                                bg="bg-stone-100"
                                text="text-zinc-700"
                            />
                        </div>

                        {/* REFERENCE */}
                        <div className="grid grid-cols-2 gap-6">

                            <InfoField
                                label="Reference Type"
                                value={
                                    notification.referenceType
                                }
                                mono
                            />

                            <InfoField
                                label="Reference ID"
                                value={
                                    notification.referenceId
                                }
                                mono
                            />
                        </div>
                                <TextAreaField 
                                    label="Nội dung"
                            value={
                                notification.content
                            }
                                />
                        {/* CREATED */}
                        <DateField
                            label="Ngày tạo thông báo"
                            value={
                                notification.createdAt
                            }
                        />

                        {/* CONTENT */}
                        <TextAreaField
                            label="Nội dung"
                            value={
                                notification.content
                            }
                        />
                    </div>

                    {/* FOOTER */}
                    <div className="px-8 py-5 border-t border-neutral-200 flex justify-end bg-white shrink-0">

                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="cursor-pointer px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-base font-semibold transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
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
        <div className="flex flex-col gap-2">

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

function BadgeField({
    label,
    value,
    bg,
    text,
}) {
    return (
        <div className="flex flex-col gap-2">

            <label className="text-neutral-700 text-base">
                {label}
            </label>

            <div className="px-4 py-3 rounded-lg border border-neutral-200">

                <span
                    className={`
                        inline-flex items-center px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide
                        ${bg}
                        ${text}
                    `}
                >
                    {value}
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
        <div className="flex flex-col gap-2">

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
                    {value || "-"}
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
        <div className="flex flex-col gap-2">

            <label className="text-neutral-700 text-base">
                {label}
            </label>

            <div className="min-h-28 px-4 py-3 rounded-lg border border-neutral-200 bg-white">

                <p className="text-zinc-900 text-base whitespace-pre-line leading-relaxed">
                    {value || "-"}
                </p>
            </div>
        </div>
    );
}
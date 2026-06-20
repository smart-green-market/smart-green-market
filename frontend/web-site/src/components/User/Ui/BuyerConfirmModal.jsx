import { useState } from "react";
import { AlertTriangle, Info, Loader2, X, XCircle } from "lucide-react";

const VARIANTS = {
    danger: {
        Icon: XCircle,
        iconWrapClass: "bg-red-100",
        iconClass: "text-red-600",
        confirmBtnClass: "bg-red-600 hover:bg-red-700 focus:ring-red-200",
    },
    warning: {
        Icon: AlertTriangle,
        iconWrapClass: "bg-orange-100",
        iconClass: "text-orange-500",
        confirmBtnClass: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-200",
    },
    info: {
        Icon: Info,
        iconWrapClass: "bg-teal-100",
        iconClass: "text-teal-800",
        confirmBtnClass: "bg-teal-800 hover:bg-teal-900 focus:ring-teal-200",
    },
};

export default function BuyerConfirmModal({
    open = false,
    onClose,
    onConfirm,
    title = "Xác nhận",
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "info",
    loading: externalLoading = false,
}) {
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = externalLoading || internalLoading;
    const style = VARIANTS[variant] ?? VARIANTS.info;
    const Icon = style.Icon;

    if (!open) return null;

    const handleConfirm = async () => {
        try {
            setInternalLoading(true);
            const result = await onConfirm?.();

            if (result?.success === false) {
                return;
            }

            onClose?.();
        } catch (error) {
            console.error(error);
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-stone-300 bg-zinc-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${style.iconWrapClass}`}
                        >
                            <Icon className={`h-5 w-5 ${style.iconClass}`} />
                        </div>
                        <h3 className="text-xl font-semibold text-emerald-950">{title}</h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-full p-2 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <div className="text-base leading-relaxed text-neutral-700">{message}</div>
                </div>

                <div className="flex gap-3 border-t border-stone-300 bg-zinc-100 px-6 py-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-lg px-4 py-3 text-base text-neutral-700 outline outline-1 outline-neutral-500 transition-colors hover:bg-white disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-white transition-all focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${style.confirmBtnClass}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

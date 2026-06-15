import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getFeedbackVariant } from "./feedbackVariants";
import { appToast } from "./toast";

export default function RejectModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Từ chối",
    message,
    confirmText = "Từ chối",
    cancelText = "Hủy",
    reasonLabel = "Lý do từ chối",
    reasonPlaceholder = "Nhập lý do từ chối...",
    successMessage,
    errorMessage,
    showToast = true,
    loading: externalLoading = false,
}) {
    const [reason, setReason] = useState("");
    const [internalLoading, setInternalLoading] = useState(false);
    const [reasonError, setReasonError] = useState("");
    const loading = externalLoading || internalLoading;
    const style = getFeedbackVariant("reject");
    const Icon = style.Icon;

    useEffect(() => {
        if (!isOpen) {
            setReason("");
            setReasonError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            setReasonError("Vui lòng nhập lý do từ chối.");
            return;
        }

        try {
            setInternalLoading(true);
            setReasonError("");
            await onConfirm?.(trimmedReason);

            if (showToast) {
                appToast.reject(successMessage || style.defaultSuccessMessage);
            }

            onClose?.();
        } catch (error) {
            console.error(error);

            if (showToast) {
                appToast.reject(errorMessage || style.defaultErrorMessage);
            }
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div
                className={`mx-4 w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-xl ${style.panelClass}`}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${style.iconWrapClass}`}
                        >
                            <Icon className={`h-5 w-5 ${style.iconClass}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-4">
                    {message ? <div className="text-gray-600">{message}</div> : null}

                    <div className="space-y-2">
                        <label
                            htmlFor="rejection-reason"
                            className="text-sm font-medium text-neutral-700"
                        >
                            {reasonLabel}
                        </label>
                        <textarea
                            id="rejection-reason"
                            rows={4}
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value);
                                if (reasonError) setReasonError("");
                            }}
                            placeholder={reasonPlaceholder}
                            className={`w-full resize-none rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                                reasonError
                                    ? "border-red-400 focus:ring-red-200"
                                    : "border-stone-300 focus:ring-rose-200"
                            }`}
                        />
                        {reasonError ? (
                            <p className="text-sm text-red-600">{reasonError}</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 cursor-pointer rounded-xl border border-neutral-300 px-4 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 font-medium text-white transition-all focus:outline-none focus:ring-4 disabled:opacity-50 ${style.confirmBtnClass}`}
                    >
                        {loading ? "Đang xử lý..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

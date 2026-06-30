import { useState } from "react";
import { X } from "lucide-react";
import { getFeedbackVariant } from "./feedbackVariants";
import { appToast } from "./toast";

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "warning",
    successMessage,
    errorMessage,
    showToast = true,
    loading: externalLoading = false,
}) {
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = externalLoading || internalLoading;
    const style = getFeedbackVariant(variant);
    const Icon = style.Icon;

    if (!isOpen) return null;

    const handleConfirm = async () => {
        try {
            setInternalLoading(true);
            await onConfirm?.();

            if (showToast) {
                appToast[variant === "danger" ? "danger" : variant](
                    successMessage || style.defaultSuccessMessage,
                );
            }

            onClose?.();
        } catch (error) {
            console.error(error);

            if (showToast && !error?.toastHandled) {
                appToast.danger(errorMessage || style.defaultErrorMessage);
            }
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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

                <div className="px-6 py-4">
                    <div className="text-gray-600">{message}</div>
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

import { toast as sonnerToast } from "sonner";
import { getFeedbackVariant } from "./feedbackVariants";

function showVariantToast(variant, message, options = {}) {
    const style = getFeedbackVariant(variant);
    const toastKey = variant === "danger" || variant === "reject" ? "error" : variant;
    const toastFn =
        variant === "reject"
            ? sonnerToast
            : sonnerToast[toastKey] || sonnerToast;

    return toastFn(message, {
        duration: 3500,
        className: `${style.toastClass} !border`,
        ...options,
    });
}

export const appToast = {
    success: (message, options) => showVariantToast("success", message, options),
    info: (message, options) => showVariantToast("info", message, options),
    warning: (message, options) => showVariantToast("warning", message, options),
    danger: (message, options) => showVariantToast("danger", message, options),
    reject: (message, options) => showVariantToast("reject", message, options),
    error: (message, options) => showVariantToast("danger", message, options),
};

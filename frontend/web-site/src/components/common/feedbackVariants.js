import {
    AlertTriangle,
    CheckCircle2,
    Info,
    XCircle,
} from "lucide-react";

export const FEEDBACK_VARIANTS = {
    success: {
        label: "Thành công",
        Icon: CheckCircle2,
        iconClass: "text-emerald-600",
        iconWrapClass: "bg-emerald-100",
        confirmBtnClass:
            "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200",
        panelClass: "border-emerald-100",
        toastClass:
            "!bg-emerald-50 !text-emerald-900 !border-emerald-200",
        defaultSuccessMessage: "Thao tác thành công",
        defaultErrorMessage: "Không thể hoàn tất thao tác",
    },
    info: {
        label: "Thông tin",
        Icon: Info,
        iconClass: "text-blue-600",
        iconWrapClass: "bg-blue-100",
        confirmBtnClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-200",
        panelClass: "border-blue-100",
        toastClass: "!bg-blue-50 !text-blue-900 !border-blue-200",
        defaultSuccessMessage: "Đã lưu thông tin",
        defaultErrorMessage: "Không thể lưu thông tin",
    },
    warning: {
        label: "Cảnh báo",
        Icon: AlertTriangle,
        iconClass: "text-orange-500",
        iconWrapClass: "bg-orange-100",
        confirmBtnClass:
            "bg-orange-500 hover:bg-orange-600 focus:ring-orange-200",
        panelClass: "border-orange-100",
        toastClass: "!bg-orange-50 !text-orange-900 !border-orange-200",
        defaultSuccessMessage: "Đã cập nhật dữ liệu",
        defaultErrorMessage: "Không thể cập nhật dữ liệu",
    },
    danger: {
        label: "Nguy hiểm",
        Icon: XCircle,
        iconClass: "text-red-600",
        iconWrapClass: "bg-red-100",
        confirmBtnClass: "bg-red-600 hover:bg-red-700 focus:ring-red-200",
        panelClass: "border-red-100",
        toastClass: "!bg-red-50 !text-red-900 !border-red-200",
        defaultSuccessMessage: "Đã xóa dữ liệu",
        defaultErrorMessage: "Không thể xóa dữ liệu",
    },
    reject: {
        label: "Từ chối",
        Icon: XCircle,
        iconClass: "text-rose-600",
        iconWrapClass: "bg-rose-100",
        confirmBtnClass: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-200",
        panelClass: "border-rose-100",
        toastClass: "!bg-rose-50 !text-rose-900 !border-rose-200",
        defaultSuccessMessage: "Đã từ chối thành công",
        defaultErrorMessage: "Không thể từ chối",
    },
};

export function getFeedbackVariant(variant = "warning") {
    return FEEDBACK_VARIANTS[variant] ?? FEEDBACK_VARIANTS.warning;
}

export function getToastClassNames() {
    return Object.fromEntries(
        Object.entries(FEEDBACK_VARIANTS).map(([key, value]) => [
            key === "danger" ? "error" : key,
            `${value.toastClass} !border`,
        ]),
    );
}

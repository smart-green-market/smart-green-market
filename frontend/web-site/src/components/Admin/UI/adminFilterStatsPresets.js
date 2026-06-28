import {
    CheckCircle2,
    Clock,
    FileCheck,
    Lock,
    XCircle,
} from "lucide-react";

import { getDealerDisplayStatus } from "../Dealer/DealerFilter";

const STYLES = {
    success: {
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        valueColor: "text-emerald-700",
        activeBorder: "border-emerald-400",
        activeRing: "ring-emerald-500/30",
    },
    muted: {
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-600",
        valueColor: "text-neutral-700",
        activeBorder: "border-neutral-400",
        activeRing: "ring-neutral-500/30",
    },
    danger: {
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        valueColor: "text-red-700",
        activeBorder: "border-red-400",
        activeRing: "ring-red-500/30",
    },
    warning: {
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        valueColor: "text-amber-700",
        activeBorder: "border-amber-400",
        activeRing: "ring-amber-500/30",
    },
    info: {
        iconBg: "bg-violet-50",
        iconColor: "text-violet-600",
        valueColor: "text-violet-700",
        activeBorder: "border-violet-400",
        activeRing: "ring-violet-500/30",
    },
};

function card({ key, label, filterValue, icon, style, match }) {
    return {
        key,
        label,
        filterValue,
        icon,
        match,
        ...STYLES[style],
    };
}

/** Danh mục — status: active | inactive | rejected | pending */
export const CATEGORY_STAT_CARDS = [
    card({ key: "active", label: "Đang hoạt động", filterValue: "active", icon: CheckCircle2, style: "success" }),
    card({ key: "inactive", label: "Khóa", filterValue: "inactive", icon: Lock, style: "muted" }),
    card({ key: "rejected", label: "Từ chối", filterValue: "rejected", icon: XCircle, style: "danger" }),
    card({ key: "pending", label: "Đăng ký", filterValue: "pending", icon: Clock, style: "warning" }),
];

/** @deprecated Dùng CATEGORY_STAT_CARDS */
export const ADMIN_STATUS_STAT_CARDS = CATEGORY_STAT_CARDS;

/** Nhà cung cấp — verification_status: approved | rejected | pending */
export const SUPPLIER_STAT_CARDS = [
    card({ key: "approved", label: "Đang hoạt động", filterValue: "approved", icon: CheckCircle2, style: "success" }),
    card({ key: "rejected", label: "Từ chối", filterValue: "rejected", icon: XCircle, style: "danger" }),
    card({ key: "pending", label: "Đăng ký", filterValue: "pending", icon: Clock, style: "warning" }),
];

/** Đại lý — dùng getDealerDisplayStatus (status + account_status) */
export const DEALER_STAT_CARDS = [
    card({
        key: "active",
        label: "Đang hoạt động",
        filterValue: "active",
        icon: CheckCircle2,
        style: "success",
        match: (row) => getDealerDisplayStatus(row) === "active",
    }),
    card({
        key: "inactive",
        label: "Tạm khóa",
        filterValue: "inactive",
        icon: Lock,
        style: "muted",
        match: (row) => getDealerDisplayStatus(row) === "inactive",
    }),
    card({
        key: "rejected",
        label: "Từ chối",
        filterValue: "rejected",
        icon: XCircle,
        style: "danger",
        match: (row) => getDealerDisplayStatus(row) === "rejected",
    }),
    card({
        key: "pending",
        label: "Chờ duyệt",
        filterValue: "pending",
        icon: Clock,
        style: "warning",
        match: (row) => getDealerDisplayStatus(row) === "pending",
    }),
];

/** Sản phẩm — status: active | inactive | rejected | pending */
export const PRODUCT_STAT_CARDS = [
    card({ key: "active", label: "Đang hoạt động", filterValue: "active", icon: CheckCircle2, style: "success" }),
    card({ key: "inactive", label: "Tạm ngưng", filterValue: "inactive", icon: Lock, style: "muted" }),
    card({ key: "rejected", label: "Từ chối", filterValue: "rejected", icon: XCircle, style: "danger" }),
    card({ key: "pending", label: "Chờ duyệt", filterValue: "pending", icon: Clock, style: "warning" }),
];

/** Chứng chỉ — status: approved | rejected | pending */
export const CERTIFICATION_STAT_CARDS = [
    card({ key: "approved", label: "Đã duyệt", filterValue: "approved", icon: FileCheck, style: "info" }),
    card({ key: "rejected", label: "Từ chối", filterValue: "rejected", icon: XCircle, style: "danger" }),
    card({ key: "pending", label: "Đăng ký", filterValue: "pending", icon: Clock, style: "warning" }),
];

/** Giấy tờ — status: approved | rejected | pending */
export const DOCUMENT_STAT_CARDS = [
    card({ key: "approved", label: "Đã duyệt", filterValue: "approved", icon: FileCheck, style: "info" }),
    card({ key: "rejected", label: "Từ chối", filterValue: "rejected", icon: XCircle, style: "danger" }),
    card({ key: "pending", label: "Đăng ký", filterValue: "pending", icon: Clock, style: "warning" }),
];

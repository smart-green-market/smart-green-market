// Cấu hình trạng thái dùng chung cho sản phẩm / nhà cung cấp
export const STATUS_CONFIG = {
    active: {
        label: "Đang hoạt động",
        bg: "bg-green-100",
        text: "text-green-700",
        dot: "bg-green-500",
    },
    inactive: {
        label: "Tạm ngưng",
        bg: "bg-orange-100",
        text: "text-orange-700",
        dot: "bg-orange-500",
    },
    paused: {
        label: "Tạm ngưng",
        bg: "bg-orange-100",
        text: "text-orange-700",
        dot: "bg-orange-500",
    },
    rejected: {
        label: "Từ chối",
        bg: "bg-red-100",
        text: "text-red-700",
        dot: "bg-red-500",
    },
    pending: {
        label: "Chờ duyệt",
        bg: "bg-amber-100",
        text: "text-amber-700",
        dot: "bg-amber-500",
    },
};

export default function StatusBadge({ status, size = "md" }) {
    const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

    const sizeClass =
        size === "sm"
            ? "px-2 py-0.5 text-[10px]"
            : "px-2.5 py-1 text-xs";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide font-['Geist',sans-serif] ${sizeClass} ${st.bg} ${st.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
        </span>
    );
}

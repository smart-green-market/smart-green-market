import { CheckCircle2, Clock3, Package, Truck, XCircle } from "lucide-react";

const toneStyles = {
    received: "bg-amber-100 text-amber-800",
    preparing: "bg-emerald-200 text-teal-800",
    shipping: "bg-sky-100 text-sky-800",
    completed: "bg-zinc-200 text-neutral-700",
    cancelled: "bg-red-100 text-red-700",
};

const toneIcons = {
    received: Package,
    preparing: Clock3,
    shipping: Truck,
    completed: CheckCircle2,
    cancelled: XCircle,
};

export default function OrderStatusBadge({ label, tone = "preparing", compact = false }) {
    const Icon = toneIcons[tone] ?? Clock3;
    const styles = toneStyles[tone] ?? toneStyles.preparing;

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full ${styles} ${
                compact ? "px-2.5 py-1" : "px-4 py-1.5"
            }`}
        >
            <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{label}</span>
        </div>
    );
}

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { computeTrend } from "../../../utils/adminStatisticsUtils";

export default function TrendBadge({ current, previous, label = "so với tháng trước" }) {
    const { changePercent, direction } = computeTrend(current, previous);

    if (changePercent == null) return null;

    const tone =
        direction === "up"
            ? "text-emerald-700 bg-emerald-50 border-emerald-100"
            : direction === "down"
              ? "text-red-700 bg-red-50 border-red-100"
              : "text-neutral-600 bg-neutral-50 border-neutral-100";

    const Icon =
        direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone}`}
            title={label}
        >
            <Icon className="h-3.5 w-3.5" />
            {Math.abs(changePercent).toFixed(1)}%
        </span>
    );
}

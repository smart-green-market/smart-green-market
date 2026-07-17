import { useMemo } from "react";
import { formatCurrency } from "../../../utils/adminStatisticsUtils";

export default function LeaderboardPanel({
    title,
    subtitle,
    icon: Icon,
    items = [],
    nameKey,
    revenueKey,
    orderKey,
    compact = true,
    visibleItems = 3,
    className = "",
    valueLabel = "Doanh thu",
    orderLabel = "đơn hàng",
    tone = "emerald",
}) {
    const maxRevenue = useMemo(
        () => Math.max(...items.map((item) => Number(item[revenueKey] || 0)), 1),
        [items, revenueKey],
    );

    const listMaxHeight = visibleItems * (compact ? 52 : 56);
    const accent =
        tone === "indigo"
            ? { icon: "bg-indigo-50 text-indigo-700", bar: "bg-indigo-600" }
            : { icon: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-600" };

    return (
        <section
            className={`flex min-h-0 flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}
        >
            <div
                className={`flex shrink-0 items-center gap-2.5 border-b border-neutral-100 ${
                    compact ? "px-4 py-3" : "px-5 py-4"
                }`}
            >
                <div className={`shrink-0 rounded-lg p-2 ${accent.icon}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <h2
                        className={`truncate font-bold leading-tight text-neutral-900 ${
                            compact ? "text-sm" : "text-base"
                        }`}
                    >
                        {title}
                    </h2>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500">{subtitle}</p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-neutral-400">Không có dữ liệu xếp hạng</p>
                </div>
            ) : (
                <div
                    className="divide-y divide-neutral-100 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
                    style={{ maxHeight: `${listMaxHeight}px` }}
                >
                    {items.map((item, index) => {
                        const revenue = Number(item[revenueKey] || 0);
                        const orders = item[orderKey] || 0;
                        const percentage = (revenue / maxRevenue) * 100;
                        const rank = index + 1;

                        let rankBg = "bg-stone-100 text-stone-600";
                        if (rank === 1) rankBg = "bg-amber-100 text-amber-800 font-bold";
                        else if (rank === 2) rankBg = "bg-slate-100 text-slate-800 font-bold";
                        else if (rank === 3) rankBg = "bg-orange-100 text-orange-800 font-bold";

                        return (
                            <div
                                key={item.id || index}
                                className={`flex flex-col gap-1.5 transition-colors hover:bg-stone-50/50 ${
                                    compact ? "px-4 py-2.5" : "px-5 py-3"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${rankBg}`}
                                        >
                                            {rank}
                                        </span>
                                        <span
                                            className={`truncate font-semibold text-neutral-800 ${
                                                compact ? "text-xs" : "text-sm"
                                            }`}
                                        >
                                            {item[nameKey]}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 flex-col text-right">
                                        <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                                            {valueLabel}
                                        </span>
                                        <span
                                            className={`font-bold font-mono text-neutral-900 ${
                                                compact ? "text-xs" : "text-sm"
                                            }`}
                                        >
                                            {formatCurrency(revenue)}
                                        </span>
                                        <span className="text-[10px] text-neutral-400">
                                            {orders} {orderLabel}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-stone-100">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import StatisticsChart from "./StatisticsChart";

function SidebarRankBadge({ rank }) {
    let rankClass = "bg-stone-100 text-stone-600";

    if (rank === 1) rankClass = "bg-amber-100 text-amber-800 font-bold";
    else if (rank === 2) rankClass = "bg-slate-100 text-slate-800 font-bold";
    else if (rank === 3) rankClass = "bg-orange-100 text-orange-800 font-bold";

    return (
        <span
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${rankClass}`}
        >
            {rank}
        </span>
    );
}

export default function StatisticsDataSection({
    title,
    subtitle,
    icon: Icon,
    columns = [],
    rows = [],
    chartLabelKey,
    chartValueKey,
    chartValueFormatter,
    emptyMessage = "Không có dữ liệu",
    defaultView = "table",
    chartSidebar = null,
}) {
    const [viewMode, setViewMode] = useState(defaultView);
    const chartHeight = rows.length > 6 ? 300 : 280;

    const chartData = rows.map((row, index) => ({
        ...row,
        label:
            typeof chartLabelKey === "function"
                ? chartLabelKey(row, index)
                : row[chartLabelKey],
        value: Number(row[chartValueKey] || 0),
    }));

    const renderChart = (hideXLabels = false) => (
        <StatisticsChart
            data={chartData}
            labelKey="label"
            valueKey="value"
            valueFormatter={chartValueFormatter}
            emptyMessage={emptyMessage}
            height={chartHeight}
            hideXLabels={hideXLabels}
            fitContainer={hideXLabels}
        />
    );

    const renderSidebar = () => {
        if (!chartSidebar) return null;

        const { nameKey = "name", quantityKey = "sales", title: sidebarTitle = "Xếp hạng" } =
            chartSidebar;

        return (
            <aside className="flex min-h-0 min-w-0 flex-col border-t border-neutral-100 xl:border-t-0 xl:border-l">
                <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                            {sidebarTitle}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            Đã bán
                        </span>
                    </div>
                </div>
                <div
                    className="divide-y divide-neutral-100 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
                    style={{ maxHeight: `${chartHeight}px` }}
                >
                    {rows.map((row, index) => (
                        <div
                            key={row.id ?? index}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-stone-50/70"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <SidebarRankBadge rank={index + 1} />
                                <span className="truncate text-xs font-semibold text-neutral-800">
                                    {row[nameKey]}
                                </span>
                            </div>
                            <span className="shrink-0 text-xs font-bold tabular-nums text-neutral-700">
                                {row[quantityKey] ?? 0}
                            </span>
                        </div>
                    ))}
                </div>
            </aside>
        );
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                    {Icon ? (
                        <div className="shrink-0 rounded-lg bg-emerald-50 p-2 text-emerald-700">
                            <Icon className="h-4 w-4" />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
                        {subtitle ? (
                            <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex rounded-xl border border-stone-200/50 bg-stone-100 p-0.5">
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            viewMode === "table"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-800"
                        }`}
                    >
                        <Table2 className="h-3.5 w-3.5" />
                        Bảng
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("chart")}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            viewMode === "chart"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-800"
                        }`}
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Biểu đồ
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
                    <p className="text-sm font-medium text-neutral-400">{emptyMessage}</p>
                </div>
            ) : viewMode === "table" ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/80">
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500 ${
                                            column.align === "right" ? "text-right" : "text-left"
                                        }`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {rows.map((row, rowIndex) => (
                                <tr key={row.id ?? rowIndex} className="hover:bg-stone-50/70">
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-5 py-3 text-neutral-800 ${
                                                column.align === "right" ? "text-right" : "text-left"
                                            } ${column.className ?? ""}`}
                                        >
                                            {column.render
                                                ? column.render(row, rowIndex)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : chartSidebar ? (
                <div className="grid grid-cols-1 items-start xl:grid-cols-[minmax(0,1.55fr)_minmax(240px,0.85fr)]">
                    <div className="min-w-0 overflow-x-auto px-4 py-4 sm:px-5">
                        {renderChart(true)}
                    </div>
                    {renderSidebar()}
                </div>
            ) : (
                <div className={`px-4 py-4 sm:px-5 ${rows.length > 6 ? "overflow-x-auto" : ""}`}>
                    {renderChart(false)}
                </div>
            )}
        </section>
    );
}

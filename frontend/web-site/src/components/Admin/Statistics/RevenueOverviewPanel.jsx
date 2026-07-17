import { useState } from "react";
import { BarChart3, Info, Table2, TrendingUp } from "lucide-react";
import StatisticsChart from "./StatisticsChart";
import TrendBadge from "./TrendBadge";
import { formatCurrency } from "../../../utils/adminStatisticsUtils";

export default function RevenueOverviewPanel({
    rows = [],
    emptyMessage = "Không có dữ liệu biểu đồ doanh thu",
    title = "Doanh thu Đại lý theo tháng",
    subtitle = "Dòng tiền Buyer → Đại lý từ đơn đã giao/hoàn tất trong 6 tháng gần nhất",
    valueLabel = "Doanh thu Đại lý",
    infoText = "Chỉ phản ánh doanh thu bán lẻ B2C từ đơn Buyer.",
    tone = "emerald",
}) {
    const [viewMode, setViewMode] = useState("chart");
    const [chartType, setChartType] = useState("line");

    const chartData = rows.map((row) => ({
        ...row,
        label: row.month,
        value: row.revenue,
    }));
    const toneClasses =
        tone === "indigo"
            ? {
                  icon: "text-indigo-600",
                  active: "text-indigo-800",
                  info: "border-indigo-100 bg-indigo-50/70 text-indigo-900",
              }
            : {
                  icon: "text-emerald-600",
                  active: "text-emerald-800",
                  info: "border-emerald-100 bg-emerald-50/70 text-emerald-900",
              };

    return (
        <section className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
                        <TrendingUp className={`h-4 w-4 shrink-0 ${toneClasses.icon}`} />
                        {title}
                    </h2>
                    <p className="mt-0.5 text-xs text-neutral-500">
                        {subtitle}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-xl border border-stone-200/50 bg-stone-100 p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                viewMode === "table"
                                    ? `bg-white ${toneClasses.active} shadow-sm`
                                    : "text-neutral-500 hover:text-neutral-800"
                            }`}
                        >
                            <Table2 className="h-3.5 w-3.5" />
                            Bảng
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("chart")}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                viewMode === "chart"
                                    ? `bg-white ${toneClasses.active} shadow-sm`
                                    : "text-neutral-500 hover:text-neutral-800"
                            }`}
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Biểu đồ
                        </button>
                    </div>

                    {viewMode === "chart" ? (
                        <div className="flex rounded-xl border border-stone-200/50 bg-stone-100 p-0.5">
                            <button
                                type="button"
                                onClick={() => setChartType("line")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    chartType === "line"
                                        ? `bg-white ${toneClasses.active} shadow-sm`
                                        : "text-neutral-500 hover:text-neutral-800"
                                }`}
                            >
                                Đường
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartType("bar")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    chartType === "bar"
                                        ? `bg-white ${toneClasses.active} shadow-sm`
                                        : "text-neutral-500 hover:text-neutral-800"
                                }`}
                            >
                                Cột
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 py-16">
                    <p className="text-sm text-neutral-400">{emptyMessage}</p>
                </div>
            ) : viewMode === "table" ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/80">
                                <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-neutral-500">
                                    Tháng
                                </th>
                                <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-neutral-500">
                                    {valueLabel}
                                </th>
                                <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-neutral-500">
                                    Xu hướng
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {rows.map((row) => (
                                <tr key={row.id} className="hover:bg-stone-50/70">
                                    <td className="px-3 py-2.5 font-semibold text-neutral-900">
                                        {row.month}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                                        {formatCurrency(row.revenue)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        {row.previousRevenue != null ? (
                                            <TrendBadge
                                                current={row.revenue}
                                                previous={row.previousRevenue}
                                                label="So với tháng trước"
                                            />
                                        ) : (
                                            <span className="text-xs text-neutral-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="relative flex-1">
                    <StatisticsChart
                        data={chartData}
                        labelKey="label"
                        valueKey="value"
                        height={220}
                        chartType={chartType}
                        onChartTypeChange={setChartType}
                        showChartTypeToggle={false}
                        compact
                        emptyMessage={emptyMessage}
                        tooltipLabel={valueLabel}
                        tone={tone}
                    />
                </div>
            )}

            <div className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-4 ${toneClasses.info}`}>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {infoText}
            </div>
        </section>
    );
}

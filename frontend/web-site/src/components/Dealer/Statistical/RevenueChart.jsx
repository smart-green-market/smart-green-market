import { formatCurrency } from "./formatCurrency";

/**
 * RevenueChart
 * Grouped bar chart comparing retail revenue vs wholesale purchase cost per period.
 *
 * Props:
 *   chartData – array of { label, sales, purchases }
 */
export default function RevenueChart({ chartData }) {
    const maxChartValue =
        chartData.length > 0
            ? Math.max(...chartData.map((d) => Math.max(d.sales, d.purchases)))
            : 1000000;

    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-base font-extrabold text-emerald-950">Biểu đồ so sánh Thu &amp; Chi</h2>
                    <p className="text-xs text-neutral-400 font-medium">
                        Tương quan Doanh thu bán lẻ vs Chi phí nhập hàng sỉ
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                        <span className="text-neutral-500">Thu (Bán)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                        <span className="text-neutral-500">Chi (Nhập)</span>
                    </div>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center border-b border-neutral-100 text-neutral-400 text-xs font-medium">
                    Không có dữ liệu biểu đồ trong khoảng thời gian này
                </div>
            ) : (
                <div className="h-64 flex items-end justify-start gap-3 pt-6 px-2 border-b border-neutral-100 overflow-x-auto">
                    {chartData.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center gap-1 group cursor-pointer shrink-0"
                        >
                            {/* Tooltip on hover */}
                            <div className="absolute -translate-y-24 scale-0 group-hover:scale-100 pointer-events-none transition-all duration-200 bg-neutral-900/90 text-white rounded-lg p-2 text-[10px] font-bold shadow-md z-20 flex flex-col gap-1 w-32">
                                <div className="text-neutral-400 border-b border-neutral-700 pb-0.5 mb-0.5">
                                    {item.label}
                                </div>
                                <div className="flex justify-between text-emerald-400">
                                    <span>Thu:</span>
                                    <span>{formatCurrency(item.sales)}</span>
                                </div>
                                <div className="flex justify-between text-amber-400">
                                    <span>Chi:</span>
                                    <span>{formatCurrency(item.purchases)}</span>
                                </div>
                            </div>

                            {/* Side-by-side columns */}
                            <div className="flex items-end gap-0.5">
                                <div
                                    className="w-5 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-300"
                                    style={{ height: `${Math.max((item.sales / (maxChartValue || 1)) * 160, 4)}px` }}
                                />
                                <div
                                    className="w-5 bg-amber-500 hover:bg-amber-600 rounded-t-sm transition-all duration-300"
                                    style={{ height: `${Math.max((item.purchases / (maxChartValue || 1)) * 160, 4)}px` }}
                                />
                            </div>

                            <span className="text-[10px] text-neutral-500 font-semibold py-1">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

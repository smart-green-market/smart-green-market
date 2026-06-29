import { formatCurrency } from "./utils";

export default function RevenueChart({ chartData, maxChartRevenue, totalWeeklyRevenue }) {
    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">Biểu đồ doanh thu 7 ngày qua</h2>
                    <p className="text-xs text-neutral-400">Thống kê doanh số bán rau củ quả theo ngày</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg">
                    Tổng: {formatCurrency(totalWeeklyRevenue)}
                </span>
            </div>

            {/* Chart visual with Tailwind */}
            <div className="h-64 flex items-end justify-between pt-6 px-2 border-b border-neutral-100">
                {chartData.map((data, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                        <div className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-1.5 py-0.5 rounded shadow-xs mb-1">
                            {formatCurrency(data.amount)}
                        </div>
                        {/* Column bar */}
                        <div
                            className="w-8 sm:w-12 bg-emerald-100 hover:bg-emerald-600 rounded-t-lg transition-all duration-300"
                            style={{ height: `${Math.max((data.amount / (maxChartRevenue || 1)) * 180, 5)}px` }}
                        ></div>
                        <span className="text-xs text-neutral-500 font-medium py-2">
                            {data.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

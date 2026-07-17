import { RefreshCw } from "lucide-react";

/**
 * StatsFilterBar
 * Date range + group-by selector + Apply button.
 *
 * Props:
 *   startDate    – current start date string (YYYY-MM-DD)
 *   endDate      – current end date string (YYYY-MM-DD)
 *   groupBy      – current group-by value ("day" | "week" | "month")
 *   loading      – whether data is currently being fetched
 *   onStartDate  – setter for startDate
 *   onEndDate    – setter for endDate
 *   onGroupBy    – setter for groupBy
 *   onApply      – callback to trigger data fetch
 */
export default function StatsFilterBar({
    startDate,
    endDate,
    groupBy,
    loading,
    onStartDate,
    onEndDate,
    onGroupBy,
    onApply,
}) {
    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                {/* Start Date */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Từ ngày</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDate(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-medium text-neutral-700"
                        />
                    </div>
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Đến ngày</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndDate(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-medium text-neutral-700"
                        />
                    </div>
                </div>

                {/* Group By */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Xem theo</label>
                    <select
                        value={groupBy}
                        onChange={(e) => onGroupBy(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-medium text-neutral-700 cursor-pointer"
                    >
                        <option value="day">Từng ngày</option>
                        <option value="week">Từng tuần</option>
                        <option value="month">Từng tháng</option>
                    </select>
                </div>
            </div>

            <div className="flex items-end shrink-0 pt-0 lg:pt-4">
                <button
                    onClick={onApply}
                    disabled={loading}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Thống kê
                </button>
            </div>
        </div>
    );
}

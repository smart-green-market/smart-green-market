import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import statisticalService from "../../services/api/statisticalService";
import StatsHeader from "../../components/Dealer/Statistical/StatsHeader";
import StatsFilterBar from "../../components/Dealer/Statistical/StatsFilterBar";
import MetricCards from "../../components/Dealer/Statistical/MetricCards";
import RevenueChart from "../../components/Dealer/Statistical/RevenueChart";
import CategoryDistribution from "../../components/Dealer/Statistical/CategoryDistribution";
import DetailedTable from "../../components/Dealer/Statistical/DetailedTable";

// ─── helpers ───────────────────────────────────────────────────────────────
const getFirstDayOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default function DealerStatsPage() {
    const [startDate, setStartDate] = useState(getFirstDayOfMonth());
    const [endDate, setEndDate] = useState(getTodayDate());
    const [groupBy, setGroupBy] = useState("day");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticalService.getDealerStats({
                start_date: startDate,
                end_date: endDate,
                group_by: groupBy,
            });
            setData(res);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu thống kê:", err);
            setError("Không thể tải dữ liệu thống kê. Vui lòng kiểm tra lại kết nối.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Export to CSV
    const handleExportCSV = () => {
        if (!data || !data.detailed_breakdown || data.detailed_breakdown.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Thời gian,Số đơn bán,Doanh thu bán,Số đơn nhập,Chi phí nhập,Lợi nhuận gộp\n";

        data.detailed_breakdown.forEach((row) => {
            csvContent += `${row.period},${row.sales_count},${row.revenue},${row.purchase_count},${row.purchase_cost},${row.profit}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Bao_cao_thong_ke_dai_ly_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── loading state ──────────────────────────────────────────────────────
    if (loading && !data) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                    <span className="text-sm text-neutral-500 font-semibold animate-pulse">
                        Đang tải dữ liệu báo cáo...
                    </span>
                </div>
            </div>
        );
    }

    // ── derived data ───────────────────────────────────────────────────────
    const metrics = data?.metrics || {
        total_revenue: 0,
        total_purchase_cost: 0,
        gross_profit: 0,
        profit_margin: 0,
        completed_sales_count: 0,
        completed_purchases_count: 0,
    };

    const chartData = data?.chart_data || [];
    const categoryDistribution = data?.category_distribution || [];
    const detailedBreakdown = data?.detailed_breakdown || [];

    // ── render ─────────────────────────────────────────────────────────────
    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">

            <StatsHeader data={data} onExport={handleExportCSV} />

            <StatsFilterBar
                startDate={startDate}
                endDate={endDate}
                groupBy={groupBy}
                loading={loading}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
                onGroupBy={setGroupBy}
                onApply={fetchStats}
            />

            {error && (
                <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <MetricCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <RevenueChart chartData={chartData} />
                <CategoryDistribution categoryDistribution={categoryDistribution} />
            </div>

            <DetailedTable detailedBreakdown={detailedBreakdown} />

        </div>
    );
}

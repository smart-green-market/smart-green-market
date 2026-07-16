import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    ShoppingBag,
    Leaf,
    AlertTriangle,
    Calendar,
    RefreshCw,
    FileSpreadsheet,
    Percent,
    ArrowUpRight,
    ClipboardList,
} from "lucide-react";
import statisticalService from "../../services/api/statisticalService";

const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
};

export default function DealerStatsPage() {
    // Default dates: first day of current month -> today
    const getFirstDayOfMonth = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    };

    const getTodayDate = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

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

    // Export to CSV helper
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

    if (loading && !data) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    <span className="text-sm text-neutral-500 font-semibold animate-pulse">Đang tải dữ liệu báo cáo...</span>
                </div>
            </div>
        );
    }

    const metrics = data?.metrics || {
        total_revenue: 0,
        total_purchase_cost: 0,
        gross_profit: 0,
        profit_margin: 0,
        completed_sales_count: 0,
        completed_purchases_count: 0,
    };

    const wastageStats = data?.wastage_stats || {
        total_wastage_quantity: 0,
        total_wastage_cost: 0,
        total_returned_quantity: 0,
        total_returned_cost: 0,
    };

    const chartData = data?.chart_data || [];
    const categoryDistribution = data?.category_distribution || [];
    const detailedBreakdown = data?.detailed_breakdown || [];

    // Calculate maximum amount for chart scaling
    const maxChartValue = chartData.length > 0 
        ? Math.max(...chartData.map((d) => Math.max(d.sales, d.purchases))) 
        : 1000000;

    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-6 h-6 text-emerald-600" />
                        <h1 className="text-2xl font-black text-emerald-950">Phân tích & Thống kê</h1>
                    </div>
                    <p className="text-sm text-neutral-500 font-medium">Theo dõi và phân tích tình hình kinh doanh, dòng tiền, và hao hụt kho hàng</p>
                </div>

                <button
                    onClick={handleExportCSV}
                    disabled={!data}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Xuất báo cáo CSV
                </button>
            </div>

            {/* Toolbar Filters */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    {/* Start Date */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Từ ngày</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
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
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs rounded-xl transition-all font-medium text-neutral-700"
                            />
                        </div>
                    </div>

                    {/* Group By */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Xem theo</label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
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
                        onClick={fetchStats}
                        disabled={loading}
                        className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Thống kê
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in duration-300">
                {/* Net Revenue */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Doanh thu bán lẻ</span>
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-neutral-800 mb-1">{formatCurrency(metrics.total_revenue)}</h3>
                    <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                        {metrics.completed_sales_count} đơn hoàn thành
                    </p>
                </div>

                {/* Purchase Cost */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Chi phí nhập sỉ</span>
                        <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-neutral-800 mb-1">{formatCurrency(metrics.total_purchase_cost)}</h3>
                    <p className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded inline-block">
                        {metrics.completed_purchases_count} phiếu hoàn tất
                    </p>
                </div>

                {/* Gross Profit */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lợi nhuận gộp</span>
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${metrics.gross_profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {formatCurrency(metrics.gross_profit)}
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-medium">Doanh thu trừ giá vốn nhập</p>
                </div>

                {/* Profit Margin */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Biên lợi nhuận gộp</span>
                        <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                            <Percent className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-neutral-800 mb-1">{metrics.profit_margin.toFixed(2)}%</h3>
                    <p className="text-[10px] text-neutral-500 font-medium">Tỷ lệ lợi nhuận / doanh thu</p>
                </div>
            </div>

            {/* Main Section: Chart and Category share */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* Revenue vs Cost grouped Chart */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-extrabold text-emerald-950">Biểu đồ so sánh Thu & Chi</h2>
                            <p className="text-xs text-neutral-400 font-medium">Tương quan Doanh thu bán lẻ vs Chi phí nhập hàng sỉ</p>
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

                    {/* Dynamic Bar chart rendered using Tailwind CSS */}
                    {chartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center border-b border-neutral-100 text-neutral-400 text-xs font-medium">
                            Không có dữ liệu biểu đồ trong khoảng thời gian này
                        </div>
                    ) : (
                        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-neutral-100 overflow-x-auto">
                            {chartData.map((data, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 w-full group cursor-pointer min-w-[50px] shrink-0">
                                    
                                    {/* Tooltip on hover */}
                                    <div className="absolute -translate-y-24 scale-0 group-hover:scale-100 pointer-events-none transition-all duration-200 bg-neutral-900/90 text-white rounded-lg p-2 text-[10px] font-bold shadow-md z-20 flex flex-col gap-1 w-32">
                                        <div className="text-neutral-400 border-b border-neutral-700 pb-0.5 mb-0.5">{data.label}</div>
                                        <div className="flex justify-between text-emerald-400">
                                            <span>Thu:</span>
                                            <span>{formatCurrency(data.sales)}</span>
                                        </div>
                                        <div className="flex justify-between text-amber-400">
                                            <span>Chi:</span>
                                            <span>{formatCurrency(data.purchases)}</span>
                                        </div>
                                    </div>

                                    {/* Side by side Columns */}
                                    <div className="flex items-end gap-1 w-full justify-center">
                                        {/* Sales/Revenue column */}
                                        <div
                                            className="w-4 sm:w-6 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-300"
                                            style={{ height: `${Math.max((data.sales / (maxChartValue || 1)) * 160, 4)}px` }}
                                        />
                                        {/* Purchase column */}
                                        <div
                                            className="w-4 sm:w-6 bg-amber-500 hover:bg-amber-600 rounded-t-sm transition-all duration-300"
                                            style={{ height: `${Math.max((data.purchases / (maxChartValue || 1)) * 160, 4)}px` }}
                                        />
                                    </div>

                                    <span className="text-[10px] text-neutral-500 font-semibold py-1">
                                        {data.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Share & Distribution */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-extrabold text-emerald-950">Phân tích theo Ngành hàng</h2>
                            <p className="text-xs text-neutral-400 font-medium">Cơ cấu doanh thu & nhập hàng theo danh mục</p>
                        </div>
                    </div>

                    {categoryDistribution.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs font-medium">
                            Không có dữ liệu ngành hàng
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[250px]">
                            {categoryDistribution.map((item, idx) => {
                                const totalBoth = item.sales + item.purchases;
                                const salesPct = totalBoth > 0 ? (item.sales / totalBoth) * 100 : 0;
                                const purchasesPct = totalBoth > 0 ? (item.purchases / totalBoth) * 100 : 0;
                                
                                return (
                                    <div key={idx} className="p-3 bg-neutral-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-neutral-700">{item.category}</span>
                                            <span className="text-[10px] font-black text-neutral-500">
                                                Tổng: {formatCurrency(totalBoth)}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            {/* Sales proportion */}
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                                                    <span>Doanh thu bán ra</span>
                                                    <span className="text-emerald-700 font-bold">{formatCurrency(item.sales)} ({salesPct.toFixed(0)}%)</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${salesPct}%` }} />
                                                </div>
                                            </div>

                                            {/* Purchase proportion */}
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                                                    <span>Chi phí nhập sỉ</span>
                                                    <span className="text-amber-700 font-bold">{formatCurrency(item.purchases)} ({purchasesPct.toFixed(0)}%)</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${purchasesPct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Wastage and Returns Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Inventory Wastage */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-rose-50 text-rose-700 rounded-2xl shadow-xs">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Hao hụt tồn kho</h4>
                            <p className="text-xs text-neutral-400 font-medium">Sản phẩm tiêu hủy hoặc quá hạn sử dụng</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-black text-rose-700">{formatCurrency(wastageStats.total_wastage_cost)}</h3>
                        <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded">
                            {wastageStats.total_wastage_quantity} kg hao hụt
                        </span>
                    </div>
                </div>

                {/* Returns to Suppliers */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-amber-50 text-amber-700 rounded-2xl shadow-xs">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Trả hàng cho Nhà cung cấp</h4>
                            <p className="text-xs text-neutral-400 font-medium">Sản phẩm bị lỗi hoặc không đạt chuẩn sỉ</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-black text-amber-700">{formatCurrency(wastageStats.total_returned_cost)}</h3>
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">
                            {wastageStats.total_returned_quantity} kg trả lại
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Table breakdown */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-6 border-b border-neutral-100">
                    <h2 className="text-base font-extrabold text-emerald-950">Chi tiết lịch sử dòng tiền</h2>
                    <p className="text-xs text-neutral-400 font-medium">Bảng kê khai chi tiết doanh số và chi phí theo từng chu kỳ lọc</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">
                                <th className="p-4 pl-6">Thời gian</th>
                                <th className="p-4 text-center">Đơn bán lẻ</th>
                                <th className="p-4 text-right">Doanh thu bán</th>
                                <th className="p-4 text-center">Đơn nhập sỉ</th>
                                <th className="p-4 text-right">Chi phí nhập</th>
                                <th className="p-4 text-right pr-6">Lợi nhuận gộp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                            {detailedBreakdown.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-neutral-400 font-medium text-xs">
                                        Không tìm thấy dữ liệu mốc thời gian lọc
                                    </td>
                                </tr>
                            ) : (
                                detailedBreakdown.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="p-4 pl-6 font-bold text-neutral-800">{row.period}</td>
                                        <td className="p-4 text-center font-bold text-neutral-500">{row.sales_count}</td>
                                        <td className="p-4 text-right text-emerald-700 font-bold">{formatCurrency(row.revenue)}</td>
                                        <td className="p-4 text-center font-bold text-neutral-500">{row.purchase_count}</td>
                                        <td className="p-4 text-right text-amber-700 font-bold">{formatCurrency(row.purchase_cost)}</td>
                                        <td className={`p-4 text-right pr-6 font-black ${row.profit >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                                            {formatCurrency(row.profit)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

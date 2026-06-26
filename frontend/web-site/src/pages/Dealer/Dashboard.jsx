import { useState, useEffect } from "react";
import {
    TrendingUp,
    ShoppingBag,
    Leaf,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2
} from "lucide-react";
import dashboardService from "../../services/api/dashboard";
import { dealerService } from "../../services/api/dealerService";
import { dealerCustumerOrder } from "../../services/api/dealerCustumerOrder";

export default function DealerDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [dealerProfile, setDealerProfile] = useState(null);
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch all data in parallel
                const [
                    profileData,
                    summaryData,
                    chartDataRes,
                    topProductsData,
                    ordersData
                ] = await Promise.all([
                    dealerService.getMe(),
                    dashboardService.getSummary(),
                    dashboardService.getRevenueChart(),
                    dashboardService.getTopProducts(),
                    dealerCustumerOrder.getAll({ ordering: "-created_at", limit: 5 })
                ]);

                setDealerProfile(profileData);
                setSummary(summaryData);

                // Format chart data for Tailwind visual (needs day labels like T2, T3...)
                const formattedChart = chartDataRes.map(item => {
                    const dateObj = new Date(item.date);
                    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                    const dayName = days[dateObj.getDay()];
                    return {
                        day: dayName,
                        amount: item.revenue,
                        label: `${(item.revenue / 1000000).toFixed(1)}M`
                    };
                });
                setChartData(formattedChart);
                setTopProducts(topProductsData);
                setRecentOrders(ordersData.results || ordersData);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return <div className="p-6 flex justify-center items-center min-h-screen text-emerald-600 font-medium">Đang tải dữ liệu...</div>;
    }

    const stats = [
        {
            label: "Doanh thu hôm nay",
            value: formatCurrency(summary?.revenue?.today),
            change: `${summary?.revenue?.change_percent > 0 ? '+' : ''}${summary?.revenue?.change_percent}% so với hôm qua`,
            icon: TrendingUp,
            color: "bg-emerald-500",
            textColor: "text-emerald-700",
            bgColor: "bg-emerald-50"
        },
        {
            label: "Đơn hàng mới",
            value: `${summary?.orders?.new_today || 0} đơn`,
            change: `${summary?.orders?.pending || 0} đơn chờ xử lý`,
            icon: ShoppingBag,
            color: "bg-green-500",
            textColor: "text-green-700",
            bgColor: "bg-green-50"
        },
        {
            label: "Tồn kho nông sản",
            value: `${summary?.inventory?.total_quantity || 0} kg`,
            change: `${summary?.inventory?.new_types_today || 0} loại mới nhập hôm nay`,
            icon: Leaf,
            color: "bg-lime-500",
            textColor: "text-lime-700",
            bgColor: "bg-lime-50"
        },
        {
            label: "Cảnh báo",
            value: `${summary?.alerts?.count || 0} sản phẩm`,
            change: "Cần chú ý nhập thêm/xử lý",
            icon: AlertTriangle,
            color: "bg-amber-500",
            textColor: "text-amber-700",
            bgColor: "bg-amber-50"
        }
    ];

    // Find max revenue for chart scaling
    const maxChartRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 1000000;
    const totalWeeklyRevenue = chartData.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 tracking-tight">
                        Tổng Quan Cửa Hàng
                    </h1>
                    <p className="text-sm text-emerald-800/70 mt-1">
                        Chào mừng trở lại! Hôm nay cửa hàng nông sản của bạn đang hoạt động rất tốt.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đại lý: {dealerProfile?.name || "Đang tải..."}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        {stat.label}
                                    </p>
                                    <h3 className="text-xl md:text-2xl font-bold text-neutral-800 mt-2">
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5">
                                <span className={`text-xs font-medium ${stat.textColor}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Graphics and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart: Sales Trend */}
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

                {/* Top Selling Veggies */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-emerald-950">Nông sản bán chạy</h2>
                            <p className="text-xs text-neutral-400">Top 10 mặt hàng tiêu thụ mạnh nhất</p>
                        </div>
                        <Leaf className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2">
                        {topProducts.length === 0 && <p className="text-sm text-neutral-400">Chưa có dữ liệu bán hàng</p>}
                        {topProducts.map((item, idx) => {
                            const progressPercent = Math.min((item.sales / (item.sales + item.current_stock || 1)) * 100, 100);
                            return (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xs font-bold text-neutral-800">{item.name}</h4>
                                            <p className="text-[10px] text-neutral-400">{item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-emerald-600">{formatCurrency(item.revenue)}</span>
                                            <p className="text-[10px] text-neutral-500">Đã bán: {item.sales}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[9px] text-neutral-400">Tồn kho: {item.current_stock}</span>
                                        <span className={`text-[9px] font-semibold ${item.current_stock > 10 ? "text-emerald-600" :
                                            item.current_stock > 0 ? "text-amber-600" : "text-red-500"
                                            }`}>
                                            {item.current_stock > 10 ? "Còn hàng" : item.current_stock > 0 ? "Sắp hết" : "Cháy hàng"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Orders table */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-emerald-950">Đơn hàng gần nhất</h2>
                            <p className="text-xs text-neutral-400">Các giao dịch phân phối mới nhất</p>
                        </div>
                        <button className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 cursor-pointer">
                            Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100">
                                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Mã đơn</th>
                                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Khách hàng</th>
                                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Sản phẩm</th>
                                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Tổng tiền</th>
                                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase text-center">Trạng thái</th>
                                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase text-right">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-4 text-center text-sm text-neutral-400">Không có đơn hàng nào</td>
                                    </tr>
                                )}
                                {recentOrders.map((order, idx) => (
                                    <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                        <td className="py-3.5 px-4 text-xs font-bold text-emerald-800">{order.order_code || `DH-${order.id}`}</td>
                                        <td className="py-3.5 px-4 text-xs font-semibold text-neutral-800">{order.receiver_name}</td>
                                        <td className="py-3.5 px-4 text-xs text-neutral-600 truncate max-w-[200px]">
                                            {order.items?.map(i => i.product_title).join(', ') || "Nhiều sản phẩm"}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-bold text-neutral-800">{formatCurrency(order.total_amount)}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${['delivered', 'completed'].includes(order.status) ? "bg-emerald-100 text-emerald-800" :
                                                order.status === "pending" ? "bg-amber-100 text-amber-800" :
                                                    order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                                }`}>
                                                {order.status === 'pending' ? 'Chờ xác nhận' :
                                                    order.status === 'confirmed' ? 'Đã xác nhận' :
                                                        order.status === 'processing' ? 'Đang chuẩn bị' :
                                                            order.status === 'shipping' ? 'Đang giao' :
                                                                order.status === 'delivered' ? 'Đã giao' :
                                                                    order.status === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-neutral-400 text-right">{formatDate(order.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

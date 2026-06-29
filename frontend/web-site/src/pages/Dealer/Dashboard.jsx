import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    ShoppingBag,
    Leaf,
    AlertTriangle,
} from "lucide-react";
import dashboardService from "../../services/api/dashboard";
import { dealerService } from "../../services/api/dealerService";
import {
    DashboardHeader,
    StatsCards,
    RevenueChart,
    TopProducts,
    RecentOrders,
    formatCurrency,
} from "../../components/Dealer/Dashboard";

export default function DealerDashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dealerProfile, setDealerProfile] = useState(null);
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [
                    profileData,
                    summaryData,
                    chartDataRes,
                    topProductsData,
                ] = await Promise.all([
                    dealerService.getMe(),
                    dashboardService.getSummary(),
                    dashboardService.getRevenueChart(),
                    dashboardService.getTopProducts(),
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
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
            bgColor: "bg-green-50",
            onClick: () => navigate("/dai-ly/ban-hang")
        },
        {
            label: "Tồn kho nông sản",
            value: `${summary?.inventory?.total_quantity || 0} kg`,
            change: `${summary?.inventory?.new_types_today || 0} loại mới nhập hôm nay`,
            icon: Leaf,
            color: "bg-lime-500",
            textColor: "text-lime-700",
            bgColor: "bg-lime-50",
            onClick: () => navigate("/dai-ly/kho-hang")
        },
        {
            label: "Cảnh báo",
            value: `${summary?.alerts?.count || 0} lô hàng`,
            change: "Cần chú ý nhập thêm/xử lý",
            icon: AlertTriangle,
            color: "bg-amber-500",
            textColor: "text-amber-700",
            bgColor: "bg-amber-50",
            onClick: () => navigate("/dai-ly/kho-hang")
        }
    ];

    // Find max revenue for chart scaling
    const maxChartRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 1000000;
    const totalWeeklyRevenue = chartData.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
            <DashboardHeader storeName={dealerProfile?.store_name} />

            <StatsCards stats={stats} />

            {/* Graphics and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <RevenueChart
                    chartData={chartData}
                    maxChartRevenue={maxChartRevenue}
                    totalWeeklyRevenue={totalWeeklyRevenue}
                />

                <TopProducts topProducts={topProducts} />

                <RecentOrders initialParams={{ ordering: "-created_at", status: "pending", page_size: 5 }} />
            </div>
        </div>
    );
}

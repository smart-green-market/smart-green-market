import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    ShoppingBag,
    Leaf,
    AlertTriangle,
    Sparkles,
    ArrowRight,
} from "lucide-react";
import dashboardService from "../../services/api/dashboard";
import { dealerService } from "../../services/api/dealerService";
import aiPredictionService from "../../services/api/aiPredictionService";
import {
    DashboardHeader,
    StatsCards,
    RevenueChart,
    TopProducts,
    RecentOrders,
    PurchaseDonutChart,
    TopSuppliers,
    formatCurrency,
} from "../../components/Dealer/Dashboard";

export default function DealerDashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dealerProfile, setDealerProfile] = useState(null);
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [purchaseSummary, setPurchaseSummary] = useState(null);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [purchasedSuppliers, setPurchasedSuppliers] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [
                    profileData,
                    summaryData,
                    chartDataRes,
                    topProductsData,
                    purchaseSummaryData,
                    aiRecommendationsData,
                    purchasedSuppliersData,
                ] = await Promise.all([
                    dealerService.getMe(),
                    dashboardService.getSummary(),
                    dashboardService.getRevenueChart(),
                    dashboardService.getTopProducts(),
                    dashboardService.getPurchaseSummary(),
                    aiPredictionService.getDecisionRecommendations(7),
                    dashboardService.getPurchasedSuppliers(),
                ]);

                setDealerProfile(profileData);
                setSummary(summaryData);
                setPurchaseSummary(purchaseSummaryData);
                setAiRecommendations(aiRecommendationsData?.recommendations || []);
                setPurchasedSuppliers(purchasedSuppliersData || []);

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
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
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

            {/* AI Recommendations Banner */}
            {aiRecommendations && aiRecommendations.length > 0 && (
                <div className="mb-8 bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden font-['Geist'] animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Decorative abstract circle */}
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="absolute right-12 -top-12 w-24 h-24 bg-emerald-400/20 rounded-full blur-lg pointer-events-none"></div>

                    <div className="flex items-start gap-3.5 relative z-10">
                        <div className="p-2.5 bg-white/15 rounded-xl shrink-0 mt-0.5 border border-white/10 shadow-xs">
                            <Sparkles className="w-5 h-5 text-emerald-100 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded border border-emerald-400/35">Dự báo AI</span>
                                <h3 className="text-sm font-extrabold text-white">Trợ lý quyết định đề xuất hành động</h3>
                            </div>
                            <p className="text-xs text-emerald-50/90 leading-relaxed max-w-3xl">
                                AI phát hiện: <span className="font-bold underline">{aiRecommendations[0]?.title}</span>. {aiRecommendations[0]?.description.substring(0, 120)}...
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/dai-ly/du-bao-ai")}
                        className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all text-xs font-bold rounded-xl shadow-sm cursor-pointer relative z-10"
                    >
                        Xem tất cả gợi ý ({aiRecommendations.length})
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                </div>
            )}

            {/* Graphics and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <RevenueChart
                    chartData={chartData}
                    maxChartRevenue={maxChartRevenue}
                    totalWeeklyRevenue={totalWeeklyRevenue}
                />

                <TopProducts topProducts={topProducts} />

                <TopSuppliers
                    className="lg:col-span-2"
                    purchasedSuppliers={purchasedSuppliers}
                />

                <PurchaseDonutChart purchaseSummary={purchaseSummary} />

                <RecentOrders
                    className="lg:col-span-3"
                    initialParams={{ ordering: "-created_at", status: "pending", page_size: 5 }}
                />
            </div>
        </div>
    );
}

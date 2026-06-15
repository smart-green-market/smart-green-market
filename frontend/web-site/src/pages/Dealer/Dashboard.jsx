import { 
    TrendingUp, 
    ShoppingBag, 
    Leaf, 
    AlertTriangle, 
    ArrowUpRight,
    CheckCircle2,
    PackageCheck
} from "lucide-react";

export default function DealerDashboardPage() {
    // Mock Data for veggie statistics
    const stats = [
        {
            label: "Doanh thu hôm nay",
            value: "14,850,000 đ",
            change: "+12.5% so với hôm qua",
            icon: TrendingUp,
            color: "bg-emerald-500",
            textColor: "text-emerald-700",
            bgColor: "bg-emerald-50"
        },
        {
            label: "Đơn hàng mới",
            value: "36 đơn",
            change: "4 đơn chờ xử lý",
            icon: ShoppingBag,
            color: "bg-green-500",
            textColor: "text-green-700",
            bgColor: "bg-green-50"
        },
        {
            label: "Tồn kho nông sản",
            value: "840 kg",
            change: "12 loại rau củ mới về",
            icon: Leaf,
            color: "bg-lime-500",
            textColor: "text-lime-700",
            bgColor: "bg-lime-50"
        },
        {
            label: "Cảnh báo hết hạn/Hết hàng",
            value: "3 sản phẩm",
            change: "Cần nhập thêm cải ngọt",
            icon: AlertTriangle,
            color: "bg-amber-500",
            textColor: "text-amber-700",
            bgColor: "bg-amber-50"
        }
    ];

    const topSelling = [
        { name: "Cải thìa hữu cơ Đà Lạt", category: "Rau lá xanh", sales: "120 kg", revenue: "3,600,000 đ", status: "Còn hàng (45kg)", progress: "w-[85%]", color: "bg-emerald-500" },
        { name: "Cà chua bi hữu cơ", category: "Quả", sales: "85 kg", revenue: "4,250,000 đ", status: "Cận date (5kg)", progress: "w-[65%]", color: "bg-amber-500" },
        { name: "Bông cải xanh", category: "Rau lá xanh", sales: "60 kg", revenue: "2,700,000 đ", status: "Cháy hàng", progress: "w-[45%]", color: "bg-red-500" },
        { name: "Khoai tây vàng Đà Lạt", category: "Củ quả", sales: "150 kg", revenue: "3,000,000 đ", status: "Còn hàng (120kg)", progress: "w-[95%]", color: "bg-lime-500" }
    ];

    const recentOrders = [
        { id: "DH-0988", customer: "Cửa hàng Rau Sạch Quận 1", items: "Cải ngọt, Bông cải, Cà rốt", total: "1,250,000 đ", status: "Đã giao", time: "10 phút trước" },
        { id: "DH-0987", customer: "Siêu thị mini SafeFood", items: "Táo sạch, Dâu tây Đà Lạt", total: "3,400,000 đ", status: "Đang xử lý", time: "45 phút trước" },
        { id: "DH-0986", customer: "Hợp tác xã xanh Q3", items: "Nấm đùi gà, Hành lá, Ngò", total: "680,000 đ", status: "Đã giao", time: "2 giờ trước" },
        { id: "DH-0985", customer: "Nước ép Healthy Juice", items: "Cần tây, Táo xanh, Chanh", total: "1,850,000 đ", status: "Đã hủy", time: "5 giờ trước" }
    ];

    // Weekly sales mock data for simple CSS graph
    const weeklySales = [
        { day: "T2", amount: 65, label: "6.5M" },
        { day: "T3", amount: 80, label: "8.0M" },
        { day: "T4", amount: 45, label: "4.5M" },
        { day: "T5", amount: 95, label: "9.5M" },
        { day: "T6", amount: 110, label: "11M" },
        { day: "T7", amount: 145, label: "14.5M" },
        { day: "CN", amount: 125, label: "12.5M" }
    ];

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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đại lý: Đà Lạt Garden
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
                            <h2 className="text-lg font-bold text-emerald-950">Biểu đồ doanh thu tuần này</h2>
                            <p className="text-xs text-neutral-400">Thống kê doanh số bán rau củ quả theo ngày</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg">
                            Tổng: 66,000,000 đ
                        </span>
                    </div>

                    {/* Chart visual with Tailwind */}
                    <div className="h-64 flex items-end justify-between pt-6 px-2 border-b border-neutral-100">
                        {weeklySales.map((data, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                <div className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-1.5 py-0.5 rounded shadow-xs mb-1">
                                    {data.label}
                                </div>
                                {/* Column bar */}
                                <div 
                                    className="w-8 sm:w-12 bg-emerald-100 hover:bg-emerald-600 rounded-t-lg transition-all duration-300"
                                    style={{ height: `${(data.amount / 150) * 180}px` }}
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
                            <p className="text-xs text-neutral-400">Các mặt hàng tiêu thụ mạnh nhất</p>
                        </div>
                        <Leaf className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="flex flex-col gap-4">
                        {topSelling.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-800">{item.name}</h4>
                                        <p className="text-[10px] text-neutral-400">{item.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-emerald-600">{item.revenue}</span>
                                        <p className="text-[10px] text-neutral-500">Đã bán: {item.sales}</p>
                                    </div>
                                </div>
                                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.progress} ${item.color} rounded-full`}></div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[9px] text-neutral-400">Thanh tiến trình bán</span>
                                    <span className={`text-[9px] font-semibold ${
                                        item.status.includes("Còn hàng") ? "text-emerald-600" :
                                        item.status.includes("Cận date") ? "text-amber-600" : "text-red-500"
                                    }`}>{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Orders table */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-emerald-950">Đơn hàng gần nhất</h2>
                            <p className="text-xs text-neutral-400">Các giao dịch phân phối trong ngày</p>
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
                                {recentOrders.map((order, idx) => (
                                    <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                        <td className="py-3.5 px-4 text-xs font-bold text-emerald-800">{order.id}</td>
                                        <td className="py-3.5 px-4 text-xs font-semibold text-neutral-800">{order.customer}</td>
                                        <td className="py-3.5 px-4 text-xs text-neutral-600 truncate max-w-[200px]">{order.items}</td>
                                        <td className="py-3.5 px-4 text-xs font-bold text-neutral-800">{order.total}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                order.status === "Đã giao" ? "bg-emerald-100 text-emerald-800" :
                                                order.status === "Đang xử lý" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-neutral-400 text-right">{order.time}</td>
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

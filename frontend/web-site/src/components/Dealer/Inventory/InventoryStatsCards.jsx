import StatsCard from "../Supplier/StatsCard";
import { Package, AlertTriangle, XCircle, Plus } from "lucide-react";

export default function InventoryStatsCards({ inventory }) {
    const stats = [
        { icon: Package,       label: "Tổng số lô hàng", value: inventory.length,                                           iconBg: "bg-emerald-50", valueColor: "text-neutral-800" },
        { icon: AlertTriangle, label: "Lô sắp hết hàng",  value: inventory.filter(s => s.status === "Sắp hết hàng").length, iconBg: "bg-amber-50",   valueColor: "text-amber-600" },
        { icon: XCircle,       label: "Lô hết hạn / hết hàng",      value: inventory.filter(s => s.status === "Hết hạn" || s.status === "Hết hàng").length,      iconBg: "bg-red-50",     valueColor: "text-red-600" },
    ];

    return (
        <>
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
                        <Package className="w-6 h-6 text-emerald-600" /> Quản Lý Kho Hàng
                    </h1>
                    <p className="text-sm text-emerald-800/70 mt-1">
                        Xem số lượng tồn kho nông sản theo lô hàng, hạn dùng, trạng thái tươi sạch và giá cả.
                    </p>
                </div>
                <button className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Nhập thêm hàng
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {stats.map((s, i) => <StatsCard key={i} {...s} />)}
            </div>
        </>
    );
}

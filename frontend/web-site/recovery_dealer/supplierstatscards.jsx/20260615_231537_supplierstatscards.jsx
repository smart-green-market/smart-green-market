import StatsCard from "./StatsCard";
import { Truck, Leaf, Sprout } from "lucide-react";

export default function SupplierStatsCards({ suppliers }) {
    const stats = [
        { icon: Truck, label: "Tổng nhà cung cấp", value: suppliers.length, iconBg: "bg-emerald-50", valueColor: "text-emerald-800" },
    ];

    return (
        <>
            {/* Page Header with decorative gradient accent */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                            Đối Tác Nhà Cung Cấp
                        </h1>
                    </div>
                    <p className="text-sm text-neutral-500 font-medium ml-[52px]">
                        Quản lý thông tin liên hệ các hợp tác xã và nhà vườn cung cấp nông sản.
                    </p>
                </div>

                {/* Decorative element */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50/60 rounded-xl border border-emerald-100/50">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">
                        {suppliers.length} nhà cung cấp đang hoạt động
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {stats.map((s, i) => <StatsCard key={i} {...s} />)}
            </div>
        </>
    );
}
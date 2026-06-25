import StatsCard from "./StatsCard";



import { Truck, CheckCircle, XCircle, Clock } from "lucide-react";

export default function SupplierStatsCards({ suppliers }) {
    const stats = [
        { icon: Truck,        label: "Tổng nhà cung cấp", value: suppliers.length,                                          iconBg: "bg-emerald-50", valueColor: "text-neutral-800" },
        { icon: CheckCircle,  label: "Đang hoạt động",    value: suppliers.filter(s => s.status === "Đang hợp tác").length, iconBg: "bg-emerald-50", valueColor: "text-emerald-700" },
        { icon: XCircle,      label: "Ngừng hợp tác",     value: suppliers.filter(s => s.status === "Ngừng hợp tác").length,iconBg: "bg-red-50",     valueColor: "text-red-600" },
        { icon: Clock,        label: "Chờ hợp tác",       value: suppliers.filter(s => s.status === "Tạm ngưng").length,    iconBg: "bg-amber-50",   valueColor: "text-amber-600" },
    ];

    return (
        
        
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => <StatsCard key={i} {...s} />)}
        </div>
    );
}
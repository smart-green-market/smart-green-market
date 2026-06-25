import StatsCard from "./StatsCard";
import { Truck, CheckCircle, XCircle, Clock, Plus } from "lucide-react"; //

export default function SupplierStatsCards({ suppliers }) {
    const stats = [
        { icon: Truck,       label: "Tổng nhà cung cấp", value: suppliers.length,                                           iconBg: "bg-emerald-50", valueColor: "text-neutral-800" },
        { icon: CheckCircle, label: "Đang hoạt động",    value: suppliers.filter(s => s.status === "Đang hợp tác").length,  iconBg: "bg-emerald-50", valueColor: "text-emerald-700" },
        { icon: XCircle,     label: "Ngừng hợp tác",     value: suppliers.filter(s => s.status === "Ngừng hợp tác").length, iconBg: "bg-red-50",     valueColor: "text-red-600" },
        { icon: Clock,       label: "Chờ hợp tác",       value: suppliers.filter(s => s.status === "Chưa hợp tác").length,     iconBg: "bg-amber-50",   valueColor: "text-amber-600" },
    ];

    return (
        <> {/* ← wrapper Fragment bọc 2 div */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
                        <Truck className="w-6 h-6 text-emerald-600" /> Đối Tác Nhà Cung Cấp
                    </h1>
                    <p className="text-sm text-emerald-800/70 mt-1">
                        Quản lý thông tin liên hệ các hợp tác xã và nhà vườn cung cấp rau củ quả.
                    </p>
                </div>
                <button className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Đề xuất đối tác mới
                </button>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {stats.map((s, i) => <StatsCard key={i} {...s} />)}
            </div>
        </>
    );
}
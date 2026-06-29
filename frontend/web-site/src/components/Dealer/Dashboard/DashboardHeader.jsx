import { CheckCircle2 } from "lucide-react";

export default function DashboardHeader({ storeName }) {
    return (
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
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đại lý: {storeName || "Đang tải..."}
                </span>
            </div>
        </div>
    );
}

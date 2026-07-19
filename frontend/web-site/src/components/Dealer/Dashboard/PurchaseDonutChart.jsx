import { ClipboardList } from "lucide-react";

export default function PurchaseDonutChart({ purchaseSummary }) {
    const pending = purchaseSummary?.pending_orders || 0;
    const completed = purchaseSummary?.completed_orders || 0;
    const cancelled = purchaseSummary?.cancelled_orders || 0;
    const total = pending + completed + cancelled;

    let completedPercent = 0;
    let pendingPercent = 0;
    let cancelledPercent = 0;

    if (total > 0) {
        completedPercent = (completed / total) * 100;
        pendingPercent = (pending / total) * 100;
        cancelledPercent = (cancelled / total) * 100;
    }

    // Xây dựng conic-gradient
    const conicGradient = total > 0
        ? `conic-gradient(
            #10b981 0% ${completedPercent}%, 
            #f59e0b ${completedPercent}% ${completedPercent + pendingPercent}%, 
            #f43f5e ${completedPercent + pendingPercent}% 100%
          )`
        : `conic-gradient(#e5e7eb 0% 100%)`;

    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">Thống kê phiếu nhập</h2>
                    <p className="text-xs text-neutral-400">Tỷ lệ trạng thái đơn nhập hàng</p>
                </div>
                <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-around gap-6 my-auto">
                {/* Donut Visual */}
                <div
                    className="w-36 h-36 rounded-full flex items-center justify-center relative shadow-md transition-transform hover:scale-105 duration-300 shrink-0"
                    style={{ background: conicGradient }}
                >
                    <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                        <span className="text-2xl font-black text-neutral-800">{total}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Tổng đơn</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-3.5 w-full sm:w-auto lg:w-full xl:w-auto">
                    {/* Hoàn thành */}
                    <div className="relative group flex items-center justify-between gap-4 p-2 rounded-xl hover:bg-neutral-50 transition-colors cursor-help">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs font-semibold text-neutral-600">Hoàn thành</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-neutral-800">{completed}</span>
                            <span className="text-[10px] text-neutral-400 ml-1.5">({completedPercent.toFixed(0)}%)</span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-30 bg-neutral-900/95 backdrop-blur-xs text-white text-[10px] p-2.5 rounded-xl shadow-lg border border-neutral-700 w-56 text-left whitespace-normal leading-relaxed pointer-events-none transition-all">
                            <p className="font-extrabold text-[10px] text-emerald-400 mb-1">Hoàn thành bao gồm:</p>
                            <p className="text-neutral-200">Hoàn tất đơn hàng.</p>
                            <div className="absolute top-full right-4 border-4 border-transparent border-t-neutral-900/95"></div>
                        </div>
                    </div>

                    {/* Đang xử lý */}
                    <div className="relative group flex items-center justify-between gap-4 p-2 rounded-xl hover:bg-neutral-50 transition-colors cursor-help">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-xs font-semibold text-neutral-600">Đang xử lý</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-neutral-800">{pending}</span>
                            <span className="text-[10px] text-neutral-400 ml-1.5">({pendingPercent.toFixed(0)}%)</span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-30 bg-neutral-900/95 backdrop-blur-xs text-white text-[10px] p-2.5 rounded-xl shadow-lg border border-neutral-700 w-56 text-left whitespace-normal leading-relaxed pointer-events-none transition-all">
                            <p className="font-extrabold text-[10px] text-amber-400 mb-1">Đang xử lý bao gồm:</p>
                            <p className="text-neutral-200">Chờ NCC xác nhận, Chờ đại lý duyệt, Đã xác nhận, Chờ cọc, Đã cọc, Đang chuẩn bị hàng, Đang giao, Đã giao, Yêu cầu trả hàng...</p>
                            <div className="absolute top-full right-4 border-4 border-transparent border-t-neutral-900/95"></div>
                        </div>
                    </div>

                    {/* Đã hủy / Từ chối */}
                    <div className="relative group flex items-center justify-between gap-4 p-2 rounded-xl hover:bg-neutral-50 transition-colors cursor-help">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-xs font-semibold text-neutral-600">Đã hủy / Từ chối</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-neutral-800">{cancelled}</span>
                            <span className="text-[10px] text-neutral-400 ml-1.5">({cancelledPercent.toFixed(0)}%)</span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-30 bg-neutral-900/95 backdrop-blur-xs text-white text-[10px] p-2.5 rounded-xl shadow-lg border border-neutral-700 w-56 text-left whitespace-normal leading-relaxed pointer-events-none transition-all">
                            <p className="font-extrabold text-[10px] text-rose-400 mb-1">Đã hủy / Từ chối bao gồm:</p>
                            <p className="text-neutral-200">Đã hủy đơn, Nhà cung cấp từ chối, Đã trả hàng.</p>
                            <div className="absolute top-full right-4 border-4 border-transparent border-t-neutral-900/95"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

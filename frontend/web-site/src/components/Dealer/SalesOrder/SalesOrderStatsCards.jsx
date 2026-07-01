import { ClipboardList, Clock, CheckCircle2, Package, RotateCcw, XCircle } from "lucide-react";

const STAT_CARDS = [
    {
        key: "all",
        label: "Tất cả đơn",
        icon: ClipboardList,
        filterValue: "",
        bgColor: "bg-gray-50",
        iconColor: "text-gray-500",
        countColor: "text-[#333333]",
        borderColor: "border-gray-200",
        activeBg: "bg-gray-100",
    },
    {
        key: "pending",
        label: "Chờ xác nhận",
        icon: Clock,
        filterValue: "pending",
        bgColor: "bg-amber-50",
        iconColor: "text-amber-500",
        countColor: "text-amber-700",
        borderColor: "border-amber-200",
        activeBg: "bg-amber-100",
    },
    {
        key: "processing",
        label: "Đang chuẩn bị",
        icon: Package,
        filterValue: "processing",
        bgColor: "bg-indigo-50",
        iconColor: "text-indigo-500",
        countColor: "text-indigo-700",
        borderColor: "border-indigo-200",
        activeBg: "bg-indigo-100",
    },
    {
        key: "return_requested",
        label: "Yêu cầu hoàn trả",
        icon: RotateCcw,
        filterValue: "return_requested",
        bgColor: "bg-pink-50",
        iconColor: "text-pink-500",
        countColor: "text-pink-700",
        borderColor: "border-pink-200",
        activeBg: "bg-pink-100",
    },
    {
        key: "cancelled",
        label: "Đã hủy",
        icon: XCircle,
        filterValue: "cancelled",
        bgColor: "bg-red-50",
        iconColor: "text-red-500",
        countColor: "text-red-700",
        borderColor: "border-red-200",
        activeBg: "bg-red-100",
    },
];

export default function SalesOrderStatsCards({ salesOrders = [], activeFilter = "", onFilterChange, countStatus = null, totalCount = 0 }) {
    return (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                const isActive = activeFilter === card.filterValue;

                // Lấy số lượng trực tiếp
                let count = 0;
                if (card.filterValue === "") {
                    count = totalCount;
                } else if (countStatus) {
                    count = countStatus[card.filterValue] || 0;
                } else {
                    count = salesOrders.filter((o) => (o.originalData?.status || o.status) === card.filterValue).length;
                }

                return (
                    <button
                        key={card.key}
                        onClick={() => onFilterChange?.(card.filterValue)}
                        className={`relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer group shrink-0 w-[190px] sm:w-[215px] snap-start
              ${isActive
                                ? `${card.activeBg} ${card.borderColor} shadow-sm ring-1 ring-inset ${card.borderColor}`
                                : `bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm`
                            }`}
                    >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
              ${isActive ? card.bgColor : "bg-[#F8F9FA] group-hover:" + card.bgColor}`}
                        >
                            <Icon className={`w-6 h-6 ${card.iconColor}`} />
                        </div>

                        {/* Text */}
                        <div className="text-left min-w-0">
                            <p className={`text-2xl font-extrabold leading-none ${isActive ? card.countColor : "text-[#333333]"}`}>
                                {count}
                            </p>
                            <p className="text-xs font-semibold text-[#6B7280] mt-1.5 truncate">
                                {card.label}
                            </p>
                        </div>

                        {/* Active indicator dot */}
                        {isActive && (
                            <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${card.iconColor.replace("text-", "bg-")}`} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

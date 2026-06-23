import {
  ClipboardList,
  Clock,
  Wallet,
  Truck,
  CheckCircle2,
} from "lucide-react";

const STAT_CARDS = [
  {
    key: "all",
    label: "Tất cả",
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
    filterValue: "pending_supplier_confirmation",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-500",
    countColor: "text-amber-700",
    borderColor: "border-amber-200",
    activeBg: "bg-amber-100",
  },
  {
    key: "deposit",
    label: "Chờ duyệt cọc",
    icon: Wallet,
    filterValue: "deposit_pending_verification",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-500",
    countColor: "text-blue-700",
    borderColor: "border-blue-200",
    activeBg: "bg-blue-100",
  },
  {
    key: "shipping",
    label: "Đang giao hàng",
    icon: Truck,
    filterValue: "shipping",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-500",
    countColor: "text-orange-700",
    borderColor: "border-orange-200",
    activeBg: "bg-orange-100",
  },
  {
    key: "completed",
    label: "Đã hoàn thành",
    icon: CheckCircle2,
    filterValue: "completed",
    bgColor: "bg-green-50",
    iconColor: "text-green-500",
    countColor: "text-green-700",
    borderColor: "border-green-200",
    activeBg: "bg-green-100",
  },
];

export default function PurchaseOrderStatsCard({ orders = [], activeFilter = "", onFilterChange }) {
  // Đếm số lượng đơn theo từng trạng thái
  const counts = STAT_CARDS.reduce((acc, card) => {
    acc[card.key] =
      card.filterValue === ""
        ? orders.length
        : orders.filter((o) => (o.rawStatus || o.status) === card.filterValue).length;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.filterValue;
        const count = counts[card.key] || 0;

        return (
          <button
            key={card.key}
            onClick={() => onFilterChange?.(card.filterValue)}
            className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer group
              ${isActive
                ? `${card.activeBg} ${card.borderColor} shadow-sm ring-1 ring-inset ${card.borderColor}`
                : `bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm`
              }`}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
              ${isActive ? card.bgColor : "bg-[#F8F9FA] group-hover:" + card.bgColor}`}
            >
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>

            {/* Text */}
            <div className="text-left min-w-0">
              <p className={`text-xl font-bold leading-none ${isActive ? card.countColor : "text-[#333333]"}`}>
                {count}
              </p>
              <p className="text-[11px] font-medium text-[#6B7280] mt-1 truncate">
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

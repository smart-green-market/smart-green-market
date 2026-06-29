import { Package, AlertTriangle, XCircle, Plus, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STAT_CARDS = [
  {
    key: "all",
    label: "Tổng số lô hàng",
    icon: Package,
    filterValue: "",
    bgColor: "bg-gray-50",
    iconColor: "text-gray-500",
    countColor: "text-[#333333]",
    borderColor: "border-gray-200",
    activeBg: "bg-gray-100",
  },
  {
    key: "active",
    label: "Đang hoạt động",
    icon: CheckCircle2,
    filterValue: "active",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-500",
    countColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    activeBg: "bg-emerald-100",
  },
  {
    key: "depleted",
    label: "Hết hàng",
    icon: AlertTriangle,
    filterValue: "depleted",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-500",
    countColor: "text-amber-700",
    borderColor: "border-amber-200",
    activeBg: "bg-amber-100",
  },
  {
    key: "expired",
    label: "Hết hạn",
    icon: Clock,
    filterValue: "expired",
    bgColor: "bg-red-50",
    iconColor: "text-red-500",
    countColor: "text-red-700",
    borderColor: "border-red-200",
    activeBg: "bg-red-100",
  },
  {
    key: "cancelled",
    label: "Đã hủy",
    icon: XCircle,
    filterValue: "cancelled",
    bgColor: "bg-neutral-50",
    iconColor: "text-neutral-500",
    countColor: "text-neutral-700",
    borderColor: "border-neutral-200",
    activeBg: "bg-neutral-100",
  },
];

export default function InventoryStatsCards({ inventory = [], activeFilter = "", onFilterChange, countStatus = null, totalCount = 0 }) {
  const navigate = useNavigate();

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
        <button
          onClick={() => navigate("/dai-ly/nhap-hang/tao-moi")}
          className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nhập thêm hàng
        </button>
      </div>

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
            count = inventory.filter((o) => (o.originalData?.status || o.status) === card.filterValue).length;
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
    </>
  );
}

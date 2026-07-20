import { useState } from "react";
import { Download, Plus, Users, Award, TrendingUp, XCircle, Clock, AreaChart } from "lucide-react";
import CustomerSegmentChartModal from "./CustomerSegmentChartModal";

const STAT_CARDS = [
  {
    key: "all",
    label: "Tổng khách hàng",
    icon: Users,
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
    icon: Award,
    filterValue: "active",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-500",
    countColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    activeBg: "bg-emerald-100",
  }
];

export default function CustomerHeader({
  loading,
  pagination,
  customers = [],
  onExport,
  onAdd,
  activeFilter = "",
  onFilterChange,
  countStatus = null,
  totalCount = 0,
  totalOrders = 0,
  onUpdateDays,
}) {
  const [days, setDays] = useState("");
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  const handleUpdate = () => {
    if (onUpdateDays) {
      onUpdateDays(days);
    } else {
      console.log("Cập nhật số ngày:", days);
    }
  };

  return (
    <>
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">
            Phân tích và chăm sóc tập khách hàng đại lý.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="Nhập số ngày"
              placeholder="Nhập số ngày"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-32 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={handleUpdate}
              className="px-4 py-2.5 bg-[#006A3A] hover:bg-[#005A30] text-white rounded-xl text-sm font-bold transition-all active:scale-95 duration-150 cursor-pointer shadow-md"
            >
              Phân loại khách hàng
            </button>
          </div>
          <button
            onClick={() => setIsChartModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm"
          >
            <AreaChart className="w-4 h-4" /> Xem phân loại
          </button>
          {/* <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#006A3A] hover:bg-[#005A30] text-white rounded-xl text-sm font-bold transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Thêm khách hàng
          </button> */}
        </div>
      </div>

      {/* Stat Cards Container */}
      <div className="flex flex-wrap gap-4 mb-6">
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
            count = customers.filter((o) => o.status === card.filterValue).length;
          }

          return (
            <button
              key={card.key}
              onClick={() => onFilterChange?.(card.filterValue)}
              className={`relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer group w-full sm:w-[260px] min-h-[94px]
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

        {/* Tổng đơn hàng Card */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs transition-all hover:shadow-md min-h-[94px] w-full sm:w-[260px]">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 text-sky-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-semibold tracking-wide uppercase mb-1">Tổng đơn hàng</p>
            <p className="text-2xl font-extrabold leading-none text-neutral-900">
              {loading ? "..." : totalOrders}
            </p>
          </div>
        </div>
      </div>

      <CustomerSegmentChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
      />
    </>
  );
}

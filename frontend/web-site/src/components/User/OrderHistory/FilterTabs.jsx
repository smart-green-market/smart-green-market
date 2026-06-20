// ============================================================
// FilterTabs.jsx
// Tab filter trạng thái đơn hàng: Tất cả / Đang xử lý / ...
// ============================================================
// Props:
//   activeTab : string  (tab đang chọn)
//   onChange  : (tab: string) => void
//   counts    : { all, processing, completed, cancelled }
//               (optional — hiện số đơn mỗi tab)
// ============================================================
import React from "react";

const TABS = [
  { id: "all",       label: "Tất cả" },
  { id: "processing", label: "Đang xử lý" },
  { id: "completed",  label: "Hoàn thành" },
  { id: "cancelled",  label: "Đã hủy" },
];

const FilterTabs = ({ activeTab = "all", onChange, counts = {} }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {TABS.map((tab) => {
      const active = activeTab === tab.id;
      const count  = counts[tab.id];
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium
            border transition-all duration-150
            ${active
              ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
            }`}
        >
          {tab.label}
          {/* Hiện số đơn nếu có */}
          {count != null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full
              ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default FilterTabs;

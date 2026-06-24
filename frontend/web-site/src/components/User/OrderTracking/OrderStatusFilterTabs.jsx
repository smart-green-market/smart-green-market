// src/components/OrderStatusFilterTabs.jsx

/**
 * Các tab lọc đơn hàng theo trạng thái.
 *
 * Props:
 * - tabs: [{ key, label, count }]
 * - activeKey: string — key tab đang được chọn
 * - onChange: (key) => void
 */
export default function OrderStatusFilterTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive ? "bg-emerald-800 text-white" : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${isActive ? "text-emerald-200" : "text-slate-400"}`}>
              ({tab.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}

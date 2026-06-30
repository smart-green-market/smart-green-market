import { RETURN_SUB_FILTERS } from "../../../utils/orderUtils";

/**
 * Sub-filter bên trong tab "Trả hàng" trên trang lịch sử đơn hàng.
 *
 * Props:
 * - activeKey: string — sub-filter đang chọn (all | return_requested | ...)
 * - counts: Record<string, number> — số đơn theo từng sub-filter
 * - onChange: (key) => void
 */
export default function OrderReturnSubFilterTabs({ activeKey, counts = {}, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
      <span className="w-full text-xs font-medium uppercase tracking-wide text-amber-800/70">
        Lọc trong trả hàng
      </span>
      {RETURN_SUB_FILTERS.map((tab) => {
        const isActive = tab.key === activeKey;
        const count = counts[tab.key] ?? 0;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
              isActive
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-amber-900/70 hover:bg-amber-100"
            }`}
          >
            {tab.label}
            <span className={`ml-1 ${isActive ? "text-amber-100" : "text-amber-700/50"}`}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}

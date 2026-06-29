import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

/**
 * Component tiêu đề cột có thể sort.
 * Hiển thị icon mũi tên theo trạng thái sắp xếp hiện tại.
 */
export default function SortableHeader({ label, column, sortColumn, sortDirection, onSort, className = "", align = "left" }) {
  const isActive = sortColumn === column;

  const justifyClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <th
      className={`px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider cursor-pointer select-none group hover:text-neutral-600 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1.5 ${justifyClass}`}>
        {label}
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="w-3 h-3 text-emerald-600" />
          ) : (
            <ArrowDown className="w-3 h-3 text-emerald-600" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
        )}
      </div>
    </th>
  );
}

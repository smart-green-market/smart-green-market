import { useState, useMemo, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import Pagination from "../../common/Pagination";
import SortableHeader from "../../common/SortableHeader";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
  id:              { key: "id",              type: "number" },
  type:            { key: "type",            type: "string" },
  quantity_change: { key: "quantity_change", type: "number" },
  batch_number:    { key: "batch_number",    type: "string" },
  created_at:      { key: "created_at",      type: "date" },
};

export default function ProductSalesHistory({
  transactions,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  onPageChange: propOnPageChange,
}) {
  const [localPage, setLocalPage] = useState(1);

  const isControlled = propOnPageChange !== undefined;
  const currentPage = isControlled ? (propCurrentPage || 1) : localPage;
  const onPageChange = isControlled ? propOnPageChange : setLocalPage;

  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(transactions, COLUMN_CONFIG);

  const PAGE_SIZE = 5;
  const totalPages = isControlled ? (propTotalPages || 1) : Math.max(1, Math.ceil((sortedData?.length || 0) / PAGE_SIZE));

  useEffect(() => {
    if (!isControlled) {
      setLocalPage(1);
    }
  }, [transactions, isControlled]);

  const paginatedData = useMemo(() => {
    if (isControlled) return sortedData;
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, isControlled, currentPage]);
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-xs overflow-hidden font-['Geist',sans-serif]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h2 className="text-base font-bold text-emerald-950">Lịch sử giao dịch</h2>
      </div>
      
      {!transactions || transactions.length === 0 ? (
        <div className="py-8 text-sm text-neutral-500 text-center font-semibold">
          Không có dữ liệu giao dịch.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200/60">
                  <SortableHeader label="Mã giao dịch" column="id" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Loại" column="type" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Số lượng thay đổi" column="quantity_change" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="center" />
                  <SortableHeader label="Mã lô" column="batch_number" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Thời gian" column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedData.map((row, index) => {
                  const typeMap = {
                    "sale": { label: "Bán hàng", class: "text-emerald-700 bg-emerald-50" },
                    "import": { label: "Nhập kho", class: "text-blue-700 bg-blue-50" },
                    "wastage": { label: "Hao hụt", class: "text-red-700 bg-red-50" },
                    "adjustment": { label: "Điều chỉnh", class: "text-amber-700 bg-amber-50" }
                  };
                  const mapped = typeMap[row.type] || { label: row.type, class: "text-neutral-700 bg-neutral-100" };

                  return (
                    <tr key={row.id || index} className="hover:bg-emerald-50/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-sky-800">TX-{row.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mapped.class}`}>{mapped.label}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold text-xs ${row.quantity_change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {row.quantity_change > 0 ? "+" : ""}{row.quantity_change}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500 font-mono text-xs">{row.batch_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500 text-xs">
                          {row.created_at ? new Date(row.created_at).toLocaleString("vi-VN") : "N/A"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

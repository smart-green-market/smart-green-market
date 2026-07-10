import { useMemo } from "react";
import { Eye } from "lucide-react";
import Pagination from "../../common/Pagination";
import SortableHeader from "../../common/SortableHeader";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
  batchCode:   { key: "batchCode",   type: "string" },
  productName: { key: "productName", type: "string" },
  stock:       { key: "stock",       type: "number" },
  priceImport: { key: "priceImport", type: "currency" },
  importDate:  { key: "importDate",  type: "date" },
  expiryDate:  { key: "expiryDate",  type: "date" },
  status:      { key: "status",      type: "string" },
};

export default function InventoryTable({ data, onRowClick, currentPage, totalPages, onPageChange }) {
  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(data, COLUMN_CONFIG);

  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif] py-16 text-center">
        <div className="text-sm text-neutral-500 font-semibold">
          Không tìm thấy sản phẩm nào trong kho.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-['Geist',sans-serif]">
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200/60">
                <SortableHeader label="Mã kho" column="batchCode" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Tên nông sản" column="productName" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Tồn kho" column="stock" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Giá mua" column="priceImport" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Ngày nhập" column="importDate" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Hạn dùng" column="expiryDate" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Trạng thái" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="center" />
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedData.map((row, index) => {
                const statusClass =
                  row.status === "Đang hoạt động"
                    ? "bg-emerald-100 text-emerald-800"
                    : row.status === "Hết hàng"
                      ? "bg-amber-100 text-amber-800"
                      : row.status === "Hết hạn"
                        ? "bg-red-100 text-red-800"
                        : row.status === "Đã hủy"
                          ? "bg-neutral-200 text-neutral-700"
                          : "bg-neutral-100 text-neutral-600";

                return (
                  <tr
                    key={row.id || row.batchCode || index}
                    onClick={() => onRowClick && onRowClick(row)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-emerald-800 text-xs font-bold font-mono">
                        {row.batchCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-800">{row.productName}</span>
                        <span className="text-xs text-neutral-400">{row.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-neutral-800">
                        {row.stock} {row.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-500 font-medium text-xs">{row.priceImport}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-500 text-xs font-medium">{row.importDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-600 text-xs font-bold">{row.expiryDate}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${statusClass}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end pr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick && onRowClick(row);
                          }}
                          title="Chi tiết"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer group-hover:bg-emerald-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
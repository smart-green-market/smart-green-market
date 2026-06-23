import { useState, useEffect } from "react";
import { Calendar, Package, ChevronRight } from "lucide-react";
import Pagination from "../../common/Pagination";

export default function SalesOrderList({ salesOrders, onViewDetail, onSelectedRowsChange, clearSelectedRows, currentPage = 1, totalPages = 1, onPageChange }) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [clearSelectedRows]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(salesOrders.map(r => r.uniqueId));
      setSelectedIds(newSelected);
      onSelectedRowsChange && onSelectedRowsChange({ selectedRows: salesOrders });
    } else {
      setSelectedIds(new Set());
      onSelectedRowsChange && onSelectedRowsChange({ selectedRows: [] });
    }
  };

  const handleSelectRow = (row, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(row.uniqueId);
    } else {
      newSelected.delete(row.uniqueId);
    }
    setSelectedIds(newSelected);
    
    const selectedRows = salesOrders.filter(r => newSelected.has(r.uniqueId));
    onSelectedRowsChange && onSelectedRowsChange({ selectedRows });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
      case "Đã xác nhận":
        return { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" };
      case "Đang chuẩn bị hàng":
        return { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500 animate-pulse" };
      case "Đang giao hàng":
        return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500 animate-pulse" };
      case "Đã giao":
        return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
      case "Đã hủy":
        return { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" };
      default:
        return { bg: "bg-neutral-50", text: "text-neutral-700", dot: "bg-neutral-500" };
    }
  };

  if (!salesOrders || salesOrders.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif]">
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4 border border-neutral-100">
            <Package className="w-7 h-7 text-neutral-300" />
          </div>
          <p className="text-sm text-neutral-500 font-bold mb-1">
            Không tìm thấy đơn bán hàng nào.
          </p>
          <p className="text-xs text-neutral-400 font-medium">
            Thử thay đổi bộ lọc hoặc tạo đơn mới.
          </p>
        </div>
      </div>
    );
  }

  const allSelected = salesOrders.length > 0 && selectedIds.size === salesOrders.length;

  return (
    <div className="flex flex-col gap-4 font-['Geist',sans-serif]">
      <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200/60">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Mã Đơn</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Khách Hàng</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Thời Gian</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Tổng Tiền</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-center">Trạng Thái</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {salesOrders.map((row) => {
                const statusStr = row.status || row.delivery;
                const config = getStatusConfig(statusStr);
                const isSelected = selectedIds.has(row.uniqueId);

                return (
                  <tr
                    key={row.uniqueId}
                    onClick={() => onViewDetail && onViewDetail(row)}
                    className={`transition-colors duration-150 cursor-pointer group ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-emerald-50/30'}`}
                  >
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(row, e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-extrabold text-emerald-800 group-hover:text-emerald-950 group-hover:underline underline-offset-2 transition-colors uppercase tracking-wider">
                        {row.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col py-1 gap-0.5">
                        <span className="font-bold text-sm text-neutral-800 leading-tight">
                          {row.customer}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400 font-medium">
                          <Package className="w-3 h-3 text-neutral-300 shrink-0" />
                          <span className="truncate max-w-[250px]" title={row.items}>{row.items}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 py-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600/70" />
                          <span><span className="text-neutral-400">Ngày đặt:</span> {row.date}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-extrabold text-sm text-emerald-700 whitespace-nowrap">
                        {row.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/50 shadow-sm ${config.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        <span className={`text-[11px] font-bold ${config.text} whitespace-nowrap`}>
                          {statusStr}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail && onViewDetail(row);
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer group-hover:bg-emerald-100"
                        >
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
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

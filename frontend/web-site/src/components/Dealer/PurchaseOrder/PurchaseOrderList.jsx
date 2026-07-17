import { Calendar, Package, ChevronRight, AlertCircle, CheckCircle2, Clock, Truck, CreditCard, Ban, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import SortableHeader from "../../common/SortableHeader";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
  id: { key: "id", type: "string" },
  supplier: { key: "supplier", type: "string" },
  date: { key: "date", type: "date" },
  amount: { key: "amount", type: "currency" },
  status: { key: "status", type: "string" },
};

export default function PurchaseOrderList({ purchaseOrders, onViewDetail, onSelectedRowsChange, clearSelectedRows }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(purchaseOrders, COLUMN_CONFIG);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [clearSelectedRows]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(purchaseOrders.map(r => r.rawId || r.id));
      setSelectedIds(newSelected);
      onSelectedRowsChange && onSelectedRowsChange({ selectedRows: purchaseOrders });
    } else {
      setSelectedIds(new Set());
      onSelectedRowsChange && onSelectedRowsChange({ selectedRows: [] });
    }
  };

  const handleSelectRow = (row, checked) => {
    const newSelected = new Set(selectedIds);
    const rowId = row.rawId || row.id;
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedIds(newSelected);

    const selectedRows = purchaseOrders.filter(r => newSelected.has(r.rawId || r.id));
    onSelectedRowsChange && onSelectedRowsChange({ selectedRows });
  };

  const allSelected = purchaseOrders.length > 0 && selectedIds.size === purchaseOrders.length;

  const getStatusConfig = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-amber-500" };
      case "Chờ đại lý xác nhận thay đổi":
        return { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: <AlertCircle className="w-3.5 h-3.5" />, dot: "bg-orange-500" };
      case "Đã từ chối":
        return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: <XCircle className="w-3.5 h-3.5" />, dot: "bg-rose-500" };
      case "Đã xác nhận":
        return { bg: "bg-cyan-50 border-cyan-200", text: "text-cyan-700", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-cyan-500 animate-pulse" };
      case "Chờ duyệt cọc":
        return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-amber-500 animate-pulse" };
      case "Đã thanh toán cọc":
        return { bg: "bg-teal-50 border-teal-200", text: "text-teal-700", icon: <CreditCard className="w-3.5 h-3.5" />, dot: "bg-teal-500" };
      case "Đang chuẩn bị hàng":
        return { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", icon: <Package className="w-3.5 h-3.5" />, dot: "bg-indigo-500 animate-pulse" };
      case "Đang giao hàng":
      case "Chờ giao hàng":
        return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: <Truck className="w-3.5 h-3.5" />, dot: "bg-blue-500 animate-pulse" };
      case "Đã giao hàng":
        return { bg: "bg-lime-50 border-lime-200", text: "text-lime-700", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-lime-500" };
      case "Chờ duyệt thanh toán":
      case "Chờ xác nhận thanh toán cuối":
        return { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-yellow-500 animate-pulse" };
      case "Đã hoàn thành":
        return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-emerald-500" };
      case "Đã hủy":
        return { bg: "bg-neutral-100 border-neutral-200", text: "text-neutral-600", icon: <Ban className="w-3.5 h-3.5" />, dot: "bg-neutral-400" };
      case "Yêu cầu trả hàng":
        return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-amber-500 animate-pulse" };
      case "Đã duyệt trả hàng":
        return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-emerald-500" };
      case "Từ chối trả hàng":
        return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: <XCircle className="w-3.5 h-3.5" />, dot: "bg-rose-500" };
      case "Đã trả hàng":
        return { bg: "bg-neutral-100 border-neutral-200", text: "text-neutral-600", icon: <Ban className="w-3.5 h-3.5" />, dot: "bg-neutral-400" };
      default:
        return { bg: "bg-neutral-50 border-neutral-200", text: "text-neutral-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-neutral-500" };
    }
  };

  if (!purchaseOrders || purchaseOrders.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif] py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4 border border-neutral-100">
          <Package className="w-7 h-7 text-neutral-300" />
        </div>
        <p className="text-sm text-neutral-500 font-bold mb-1">
          Không tìm thấy đơn nhập hàng nào.
        </p>
        <p className="text-xs text-neutral-400 font-medium">
          Thử thay đổi bộ lọc hoặc tạo đơn mới.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif]">
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
              <SortableHeader label="Mã Đơn" column="id" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Nhà Cung Cấp" column="supplier" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Thời Gian" column="date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Tổng Tiền" column="amount" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right" />
              <SortableHeader label="Trạng Thái" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="center" />
              <th className="w-12 px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sortedData.map((row) => {
              const statusConfig = getStatusConfig(row.status);
              const isSelected = selectedIds.has(row.rawId || row.id);
              return (
                <tr
                  key={row.rawId || row.id}
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
                  {/* Mã đơn */}
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md">
                      {row.id}
                    </span>
                  </td>

                  {/* Nhà cung cấp */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-neutral-800 leading-tight">
                        {row.supplier}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 text-[11.5px] text-neutral-400 font-medium">
                        <Package className="w-3 h-3 text-neutral-300" />
                        <span className="truncate max-w-[240px]">{row.items}</span>
                      </div>
                    </div>
                  </td>

                  {/* Thời gian */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600/70" />
                        <span>
                          <span className="text-neutral-400">Đặt:</span> {row.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
                        <Truck className="w-3.5 h-3.5 text-amber-600/70" />
                        <span>
                          <span className="text-neutral-400">Giao dự kiến:</span> {row.deliveryDate}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Tổng tiền */}
                  <td className="px-6 py-4 text-right">
                    <span className="font-extrabold text-sm text-emerald-700 whitespace-nowrap">
                      {row.amount}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex justify-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/50 shadow-xs ${statusConfig.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <span className={`text-[11px] font-bold ${statusConfig.text} whitespace-nowrap`}>
                          {row.status && row.status.length > 12 ? row.status.substring(0, 9) + "..." : row.status}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Action button */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail && onViewDetail(row);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer group-hover:bg-emerald-50"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

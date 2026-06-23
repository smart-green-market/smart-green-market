import { useState } from "react";
import { TrendingUp } from "lucide-react";
import Pagination from "../../common/Pagination";

export default function ProductSalesHistory({ transactions, currentPage = 1, totalPages = 1, onPageChange }) {
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
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Mã giao dịch</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Số lượng thay đổi</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Mã lô</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.map((row, index) => {
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
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <span className="text-neutral-600 text-xs font-medium">{row.created_by_username || "Hệ thống"}</span>
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

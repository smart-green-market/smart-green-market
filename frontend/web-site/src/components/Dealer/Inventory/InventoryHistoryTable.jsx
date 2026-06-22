import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Calendar, History } from "lucide-react";
import Pagination from "../../common/Pagination";

export default function InventoryHistoryTable({ data, currentPage, totalPages, onPageChange }) {

  return (
    <>
      <div className="mt-10 mb-4 font-['Geist',sans-serif]">
        <h2 className="text-lg font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" /> Nhật Ký Nhập Xuất Kho
        </h2>
        <p className="text-xs text-emerald-800/70 mt-1">
          Nhật ký chi tiết về các hoạt động nhập và xuất nông sản của đại lý.
        </p>
      </div>
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif]">
        {!data || data.length === 0 ? (
          <div className="py-12 text-sm text-neutral-500 text-center font-semibold">
            Chưa có giao dịch nhập xuất nào được thực hiện.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200/60">
                    <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Mã GD</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Loại giao dịch</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Thông tin lô hàng</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Số lượng</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.map((row, index) => {
                    const isImport = row.isImport;
                    return (
                      <tr
                        key={row.id || index}
                        className="hover:bg-emerald-50/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <span className="text-neutral-700 text-xs font-bold font-mono">
                            {row.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isImport
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {isImport ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {row.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col py-1.5">
                            <span className="font-bold text-neutral-800 text-xs">
                              {row.productName}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              Mã lô: {row.batchCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-bold text-xs ${isImport ? "text-emerald-700" : "text-amber-700"}`}
                          >
                            {isImport ? "+" : "-"}
                            {row.quantity} {row.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-neutral-500 text-xs font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {row.date}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-neutral-500 text-xs whitespace-normal max-w-xs">{row.note}</span>
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
    </>
  );
}

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import Pagination from "../../common/Pagination";

export default function ProductInventoryBatches({ batches, currentPage = 1, totalPages = 1, onPageChange }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-xs overflow-hidden font-['Geist',sans-serif]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
        <PackageCheck className="w-5 h-5 text-emerald-600" />
        <h2 className="text-base font-bold text-emerald-950">Lô hàng liên quan</h2>
      </div>
      
      {!batches || batches.length === 0 ? (
        <div className="py-8 text-sm text-neutral-500 text-center font-semibold">
          Không có dữ liệu lô hàng.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200/60">
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Mã lô</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Tồn kho</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Giá nhập</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Ngày nhập</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Hạn dùng</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {batches.map((row, index) => {
                  const isOutOfStock = row.remaining_quantity <= 0;
                  return (
                    <tr key={row.id || index} className="hover:bg-emerald-50/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-emerald-800">{row.batch_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-neutral-800">{row.remaining_quantity} {row.supplier_product_unit || "kg"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500 text-xs">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.import_price)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500 text-xs">
                          {row.import_date ? new Date(row.import_date).toLocaleDateString("vi-VN") : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-600 font-bold text-xs">
                          {row.expiry_date ? new Date(row.expiry_date).toLocaleDateString("vi-VN") : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOutOfStock ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {isOutOfStock ? "Hết hàng" : "Còn hàng"}
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

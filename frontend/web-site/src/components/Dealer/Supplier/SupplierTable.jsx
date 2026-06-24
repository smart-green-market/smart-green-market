import { useState } from "react";
import { Phone, MapPin, ChevronRight } from "lucide-react";
import Pagination from "../../common/Pagination";

const AVATAR_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-lime-500 to-green-600",
  "from-emerald-600 to-green-700",
];

export default function SupplierTable({ filteredInventory, onRowClick, currentPage = 1, totalPages = 1, onPageChange }) {
  if (!filteredInventory || filteredInventory.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif] py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4 border border-neutral-100">
          <MapPin className="w-7 h-7 text-neutral-300" />
        </div>
        <p className="text-sm text-neutral-500 font-bold mb-1">
          Không tìm thấy nhà cung cấp nào.
        </p>
        <p className="text-xs text-neutral-400 font-medium">
          Thử thay đổi bộ lọc hoặc thêm mới.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-['Geist',sans-serif]">
      <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200/60">
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="w-12 px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInventory.map((row) => {
                const initials = (row.company_name || "")
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase() || "NC";
                const gradientColor = AVATAR_COLORS[(row.id || 0) % AVATAR_COLORS.length];

                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors duration-150 group"
                  >
                    {/* Nhà cung cấp */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 py-1">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradientColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-emerald-800 group-hover:text-emerald-950 transition-colors leading-tight">
                            {row.company_name}
                          </span>
                          {row.description && (
                            <span className="text-[11.5px] text-neutral-400 font-medium line-clamp-1 mt-0.5 max-w-[240px]">
                              {row.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Liên hệ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="font-semibold text-sm text-neutral-700">{row.phone || "—"}</span>
                      </div>
                    </td>

                    {/* Địa chỉ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="font-medium text-[13px] text-neutral-600 line-clamp-2 max-w-[260px]">
                          {row.address || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick && onRowClick(row);
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

import { useState } from "react";
import { Eye } from "lucide-react";
import Pagination from "../../common/Pagination";

const STATUS_MAP = {
  active: { label: "Đang bán", cls: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700" },
  inactive: { label: "Ngừng bán", cls: "bg-neutral-100 text-neutral-500" },
  rejected: { label: "Từ chối", cls: "bg-red-50 text-red-600" },
  deleted: { label: "Đã xóa", cls: "bg-red-100 text-red-900" },
};

export default function ProductTable({ data, onRowClick, currentPage, totalPages, onPageChange }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif] py-16 text-center">
        <div className="text-sm text-neutral-500 font-semibold">
          Không tìm thấy sản phẩm nào.
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
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Giá bán lẻ</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Đã bán</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row, index) => {
                const images = row.images || [];
                const thumbnail = row.thumbnail || images.find(img => img.is_thumbnail)?.image_url || images[0]?.image_url;
                const info = STATUS_MAP[row.status] || { label: row.status, cls: "bg-neutral-100 text-neutral-500" };

                return (
                  <tr
                    key={row.id || index}
                    onClick={() => onRowClick && onRowClick(row)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-neutral-50 flex items-center justify-center">
                          {thumbnail ? (
                            <img src={thumbnail} alt={row.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] text-neutral-400 font-medium">N/A</div>
                          )}
                        </div>
                        <div className="flex flex-col whitespace-normal">
                          <span className="font-bold text-neutral-800 line-clamp-1" title={row.title}>{row.title}</span>
                          <span className="text-xs text-neutral-400">{row.category?.name || "Chưa phân loại"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-700">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.retail_price)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-600 font-medium text-xs">{row.sold || 0} {row.supplier_product_unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${info.cls}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end pr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick && onRowClick(row);
                          }}
                          title="Xem chi tiết"
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

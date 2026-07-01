import React from "react";
import { FileText, Package } from "lucide-react";

export default function OrderDetailItemsTable({ items }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs mb-6 overflow-hidden">
      {/* Tiêu đề bảng */}
      <div className="px-6 py-5 border-b border-neutral-50 flex items-center justify-between">
        <h2 className="font-extrabold text-neutral-900 text-base uppercase tracking-wider flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          DANH SÁCH HÀNG HÓA
        </h2>
        <span className="bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold">
          {items.length} sản phẩm
        </span>
      </div>

      {/* Nội dung bảng sản phẩm */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-wider border-b border-neutral-100">
              <th className="py-3.5 px-5 w-14 text-center whitespace-nowrap">STT</th>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">Sản phẩm</th>
              <th className="py-3.5 px-4 w-24 text-center whitespace-nowrap">SL</th>
              <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">Đơn vị tính</th>
              <th className="py-3.5 px-4 w-36 text-right whitespace-nowrap">Đơn giá (VNĐ)</th>
              <th className="py-3.5 px-5 w-40 text-right whitespace-nowrap">Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {items.map((item, idx) => {
              const isRejected = item.review_status === "rejected";
              return (
                <React.Fragment key={item.id || idx}>
                  <tr
                    className={`transition-colors ${
                      isRejected 
                        ? "bg-red-50/40 hover:bg-red-50/60 text-red-600" 
                        : "hover:bg-neutral-50/50"
                    }`}
                  >
                    <td className={`py-4 px-5 text-center font-bold ${isRejected ? "text-red-500" : "text-neutral-500"}`}>
                      {idx + 1}
                    </td>
                    <td className={`py-4 px-4 text-left font-semibold ${isRejected ? "text-red-700" : "text-neutral-800"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-neutral-50 overflow-hidden shrink-0 border flex items-center justify-center ${isRejected ? "border-red-200" : "border-neutral-100"}`}>
                          {item.product_thumbnail_url ? (
                            <img
                              src={item.product_thumbnail_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = document.createElement('span');
                                placeholder.className = `${isRejected ? "text-red-400" : "text-neutral-400"} font-extrabold text-[10px] uppercase`;
                                placeholder.innerText = item.name ? item.name.substring(0, 2) : 'SP';
                                e.target.parentNode.appendChild(placeholder);
                              }}
                            />
                          ) : (
                            <FileText className={`w-4 h-4 ${isRejected ? "text-red-400" : "text-neutral-400"}`} />
                          )}
                        </div>
                        <span>{item.name}</span>
                        {isRejected && (
                          <span className="ml-2 bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Từ chối
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-center font-extrabold ${isRejected ? "text-red-600" : "text-neutral-700"}`}>
                      {item.quantity}
                    </td>
                    <td className={`py-4 px-4 text-center font-medium ${isRejected ? "text-red-500" : "text-neutral-500"} whitespace-nowrap`}>
                      {item.unit}
                    </td>
                    <td className={`py-4 px-4 text-right font-semibold ${isRejected ? "text-red-600" : "text-neutral-600"}`}>
                      {item.price.toLocaleString("vi-VN")}
                    </td>
                    <td className={`py-4 px-5 text-right font-extrabold ${isRejected ? "text-red-700" : "text-emerald-700"}`}>
                      {(
                        item.subtotal || item.quantity * item.price
                      ).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                  {isRejected && item.rejection_reason && (
                    <tr className="bg-red-50/20">
                      <td />
                      <td colSpan="5" className="py-2.5 px-4 text-xs font-medium text-red-500 border-t-0">
                        <div className="flex items-center gap-1.5 pl-3 border-l-2 border-red-500">
                          <span className="font-bold text-red-700 uppercase tracking-wider text-[10px]">Lý do từ chối:</span>
                          <span className="italic">{item.rejection_reason}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

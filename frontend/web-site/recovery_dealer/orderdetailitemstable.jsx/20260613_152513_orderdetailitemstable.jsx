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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-wider border-b border-neutral-100">
              <th className="py-3.5 px-6 w-16 text-center">STT</th>
              <th className="py-3.5 px-4">Sản phẩm</th>
              <th className="py-3.5 px-4 w-28 text-center">Số lượng</th>
              <th className="py-3.5 px-4 w-24">Đơn vị tính</th>
              <th className="py-3.5 px-4 w-40 text-right">Đơn giá (VNĐ)</th>
              <th className="py-3.5 px-6 w-44 text-right">
                Thành tiền (VNĐ)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {items.map((item, idx) => (
              <tr
                key={item.id || idx}
                className="hover:bg-neutral-50/50 transition-colors"
              >
                <td className="py-4 px-6 text-center font-bold text-neutral-600">
                  {idx + 1}
                </td>
                <td className="py-4 px-4 font-bold text-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>{item.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-extrabold text-neutral-700 text-center">
                  {item.quantity}
                </td>
                <td className="py-4 px-4 font-medium text-neutral-500">
                  {item.unit}
                </td>
                <td className="py-4 px-4 font-bold text-neutral-500 text-right">
                  {item.price.toLocaleString("vi-VN")}
                </td>
                <td className="py-4 px-6 font-extrabold text-emerald-700 text-right">
                  {(
                    item.subtotal || item.quantity * item.price
                  ).toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

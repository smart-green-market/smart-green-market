import React from "react";
import { FileText, Package } from "lucide-react";
import {
  formatOrderItemDiscountLabel,
  getOrderItemBaseUnitPrice,
  getOrderItemLineDiscount,
  getOrderItemUnitPrice,
  orderItemHasDiscount,
} from "../../../utils/quantityDiscountUtils";

export default function OrderDetailItemsTable({ items }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs mb-6 overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-50 flex items-center justify-between">
        <h2 className="font-extrabold text-neutral-900 text-base uppercase tracking-wider flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          DANH SÁCH HÀNG HÓA
        </h2>
        <span className="bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold">
          {items.length} sản phẩm
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-wider border-b border-neutral-100">
              <th className="py-3.5 px-5 w-14 text-center whitespace-nowrap">STT</th>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">Sản phẩm</th>
              <th className="py-3.5 px-4 w-24 text-center whitespace-nowrap">SL</th>
              <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">Đơn vị</th>
              <th className="py-3.5 px-4 w-44 text-right whitespace-nowrap">Đơn giá</th>
              <th className="py-3.5 px-4 w-36 text-right whitespace-nowrap">Giảm theo SL</th>
              <th className="py-3.5 px-5 w-40 text-right whitespace-nowrap">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {items.map((item, idx) => {
              const isRejected = item.review_status === "rejected";
              const returnStatus = item.return_status || "none";
              const returnBadge = {
                return_requested: {
                  label: item.return_status_label || "Chờ duyệt trả hàng",
                  className: "bg-amber-100 text-amber-800",
                },
                partially_returned: {
                  label: item.return_status_label || "Trả một phần",
                  className: "bg-orange-100 text-orange-800",
                },
                fully_returned: {
                  label: item.return_status_label || "Đã trả hết",
                  className: "bg-slate-100 text-slate-700",
                },
              }[returnStatus];
              const unit = item.unit || item.product_unit || "kg";
              const unitPrice = getOrderItemUnitPrice(item);
              const basePrice = getOrderItemBaseUnitPrice(item);
              const lineDiscount = getOrderItemLineDiscount(item);
              const hasDiscount = orderItemHasDiscount(item);
              const discountLabel = formatOrderItemDiscountLabel(item, unit);
              const subtotal =
                item.subtotal != null
                  ? Number(item.subtotal)
                  : Number(item.quantity) * unitPrice;

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
                              alt={item.name || item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className={`w-4 h-4 ${isRejected ? "text-red-400" : "text-neutral-400"}`} />
                          )}
                        </div>
                        <span>{item.name || item.product_name}</span>
                        {isRejected && (
                          <span className="ml-2 bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Từ chối
                          </span>
                        )}
                        {!isRejected && returnBadge && (
                          <span
                            className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${returnBadge.className}`}
                          >
                            {returnBadge.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-center font-extrabold ${isRejected ? "text-red-600" : "text-neutral-700"}`}>
                      {Number(item.quantity).toLocaleString("vi-VN")}
                    </td>
                    <td className={`py-4 px-4 text-center font-medium ${isRejected ? "text-red-500" : "text-neutral-500"} whitespace-nowrap`}>
                      {unit}
                    </td>
                    <td className={`py-4 px-4 text-right ${isRejected ? "text-red-600" : ""}`}>
                      {hasDiscount ? (
                        <div className="space-y-0.5">
                          <div className="text-xs text-neutral-400 line-through">
                            {basePrice.toLocaleString("vi-VN")} đ
                          </div>
                          <div className="font-semibold text-emerald-700">
                            {unitPrice.toLocaleString("vi-VN")} đ
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-neutral-600">
                          {unitPrice.toLocaleString("vi-VN")} đ
                        </span>
                      )}
                    </td>
                    <td className={`py-4 px-4 text-right ${isRejected ? "text-red-500" : "text-emerald-700"}`}>
                      {hasDiscount ? (
                        <div className="space-y-0.5">
                          {discountLabel && (
                            <div className="text-xs font-semibold">{discountLabel}</div>
                          )}
                          <div className="text-xs">
                            -{lineDiscount.toLocaleString("vi-VN")} đ
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className={`py-4 px-5 text-right font-extrabold ${isRejected ? "text-red-700" : "text-emerald-700"}`}>
                      {subtotal.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                  {isRejected && item.rejection_reason && (
                    <tr className="bg-red-50/20">
                      <td />
                      <td colSpan="6" className="py-2.5 px-4 text-xs font-medium text-red-500 border-t-0">
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

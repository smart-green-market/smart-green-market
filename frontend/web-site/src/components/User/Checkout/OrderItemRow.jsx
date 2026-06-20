import React from "react";
import { Package } from "lucide-react";

/**
 * OrderItemRow
 * Hiển thị 1 sản phẩm trong danh sách đơn hàng (ảnh, tên, đơn giá, số lượng, thành tiền).
 *
 * Props:
 * - item: { id, name, image, unit, price, quantity }
 */
export default function OrderItemRow({ item }) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package size={22} className="text-slate-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800">{item.name}</p>
        <p className="mt-0.5 text-sm text-slate-400">
          {item.quantity} {item.unit} × {formatCurrency(item.price)}
        </p>
      </div>

      <div className="flex-shrink-0 text-right font-semibold text-slate-800">
        {formatCurrency(lineTotal)}
      </div>
    </div>
  );
}

export function formatCurrency(value) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

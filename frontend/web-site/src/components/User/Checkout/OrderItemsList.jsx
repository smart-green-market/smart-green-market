import React from "react";
import { Store } from "lucide-react";
import OrderItemRow from "./OrderItemRow";

/**
 * OrderItemsList
 * Hiển thị danh sách sản phẩm trong đơn hàng, gom theo cửa hàng.
 *
 * Props:
 * - storeName: tên cửa hàng / nhà cung cấp
 * - items: Array<{ id, name, image, unit, price, quantity }>
 */
export default function OrderItemsList({ storeName, items = [] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Store size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{storeName}</h2>
          <p className="text-sm text-slate-400">
            {items.length} sản phẩm trong đơn hàng
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

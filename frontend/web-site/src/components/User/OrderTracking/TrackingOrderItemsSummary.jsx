// src/components/TrackingOrderItemsSummary.jsx
import { formatCurrency } from "../../../utils/userOrderUtils";

/**
 * Hiển thị danh sách sản phẩm + tổng tiền của 1 đơn hàng.
 *
 * Props:
 * - items: [{ id, name, unit, quantity, price }]
 * - total: number
 */
export default function TrackingOrderItemsSummary({ items, total }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-slate-600">
              {item.quantity} {item.unit} {item.name}
            </span>
            <span className="text-slate-500">{formatCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="font-medium text-slate-700">Tổng cộng:</span>
        <span className="text-xl font-bold text-emerald-700">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

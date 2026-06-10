import { ClipboardList } from "lucide-react";
import OrderItemRow from "./OrderItemRow";
import { formatCurrency } from "./mockData";

export default function OrderInfoCard({ items, subtotal }) {
  return (
    <section className="rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-stone-300/30">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-emerald-950" />
        <h2 className="text-2xl font-semibold text-emerald-950">Thông tin đơn hàng</h2>
      </div>

      <div className="mt-6 pb-2">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t-2 border-stone-300/40 pt-6">
        <span className="text-base font-medium text-zinc-900">Tạm tính:</span>
        <span className="text-2xl font-semibold text-emerald-950">{formatCurrency(subtotal)}</span>
      </div>
    </section>
  );
}

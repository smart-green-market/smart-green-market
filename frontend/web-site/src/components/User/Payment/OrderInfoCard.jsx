import { ClipboardList } from "lucide-react";
import { formatCurrency } from "./mockData";

function OrderItemRow({ item }) {
  return (
    <div className="flex items-start justify-between border-b border-stone-300/10 py-2">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-lg">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-base font-semibold text-emerald-950">{item.name}</p>
          <p className="text-base font-normal text-neutral-700">
            Số lượng: {item.quantity}
            {item.unit}
          </p>
        </div>
      </div>
      <p className="text-base font-medium text-zinc-900">{formatCurrency(item.totalPrice)}</p>
    </div>
  );
}

export default function OrderInfoCard({ items }) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-stone-300/20">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-teal-800" />
        <h2 className="text-2xl font-semibold text-zinc-900">Thông tin đơn hàng</h2>
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}

        <div className="flex items-center justify-between border-t border-emerald-950/20 pt-4">
          <p className="text-base font-bold uppercase tracking-wide text-emerald-950">
            Tổng tạm tính
          </p>
          <p className="text-2xl font-semibold text-emerald-950">{formatCurrency(subtotal)}</p>
        </div>
      </div>
    </section>
  );
}

import OrderStatusBadge from "./OrderStatusBadge";
import { formatCurrency } from "./mockData";

export default function CompletedOrderCard({ order }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white opacity-90 shadow-sm outline outline-1 outline-stone-300">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-normal text-neutral-500">{order.id}</p>
            <h2 className="pt-1 text-2xl font-semibold text-emerald-950">{order.customerName}</h2>
            <p className="text-sm font-normal text-stone-300">{order.orderedAt}</p>
          </div>
          <OrderStatusBadge label={order.statusLabel} tone={order.statusTone} />
        </div>

        <div className="mt-6 flex items-start gap-4">
          <img src={order.image} alt={order.title} className="h-20 w-20 rounded-lg object-cover" />
          <div className="flex-1">
            <p className="text-base font-semibold text-zinc-900">{order.title}</p>
            <p className="text-sm font-normal text-neutral-700">{order.subtitle}</p>
            <p className="pt-1 text-base font-normal text-teal-800">{formatCurrency(order.total)}</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-stone-300 px-6 py-2.5 text-base font-normal text-neutral-700 hover:bg-zinc-100"
          >
            Mua lại
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-200 px-6 py-2.5 text-base font-normal text-teal-800 shadow-sm hover:bg-emerald-300"
          >
            Đánh giá sản phẩm
          </button>
        </div>
      </div>
    </article>
  );
}

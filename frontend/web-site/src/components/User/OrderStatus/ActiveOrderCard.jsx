import OrderStatusBadge from "./OrderStatusBadge";
import OrderItemList from "./OrderItemList";
import OrderProgressTracker from "./OrderProgressTracker";

export default function ActiveOrderCard({ order }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm outline outline-1 outline-stone-300">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-normal text-neutral-500">{order.id}</p>
            <h2 className="pt-1 text-2xl font-semibold text-emerald-950">{order.customerName}</h2>
            <p className="text-sm font-normal text-stone-300">{order.orderedAt}</p>
          </div>
          <OrderStatusBadge label={order.statusLabel} tone={order.statusTone} />
        </div>

        <div className="mt-4">
          <OrderItemList items={order.items} />
        </div>

        <OrderProgressTracker currentStep={order.currentStep} />

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-teal-800 px-6 py-2.5 text-base font-normal text-white shadow-sm hover:bg-teal-900"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

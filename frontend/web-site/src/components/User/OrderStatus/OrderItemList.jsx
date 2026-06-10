import { formatCurrency } from "./mockData";

export default function OrderItemList({ items }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="rounded-lg bg-zinc-100 px-5 pb-5 pt-7">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="text-base font-normal text-zinc-900">{item.name}</span>
            <span className="text-base font-normal text-neutral-500">{formatCurrency(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-stone-300 pt-4">
        <span className="text-base font-normal text-zinc-900">Tổng cộng:</span>
        <span className="text-2xl font-semibold text-teal-800">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

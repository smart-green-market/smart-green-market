import { formatCurrency } from "./mockData";

export default function OrderItemRow({ item }) {
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex items-center gap-4 border-b border-stone-300/20 py-4">
      <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />

      <div className="flex-1">
        <h3 className="text-base font-semibold text-emerald-950">{item.name}</h3>
        <p className="text-sm text-zinc-900">
          Số lượng: {item.quantity}
          {item.unit}
        </p>
      </div>

      <div className="text-right">
        <p className="text-base font-medium text-zinc-900">
          {formatCurrency(item.unitPrice)} /{item.unit}
        </p>
        <p className="text-base font-bold text-emerald-950">{formatCurrency(lineTotal)}</p>
      </div>
    </div>
  );
}

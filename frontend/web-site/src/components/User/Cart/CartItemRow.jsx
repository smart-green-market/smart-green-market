import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "./mockData";

export default function CartItemRow({
  item,
  onToggleSelect,
  onDecrease,
  onIncrease,
  onRemove,
}) {
  return (
    <div className="grid grid-cols-[40px_1.6fr_1fr_1fr_1fr] items-center gap-4 p-6 border-t border-stone-300/10 first:border-t-0">
      <div>
        <input
          type="checkbox"
          checked={item.selected}
          onChange={() => onToggleSelect(item.id)}
          className="h-4 w-4 rounded border-stone-400 text-teal-800 focus:ring-teal-700"
        />
      </div>

      <div className="flex items-center gap-4">
        <img
          src={item.image}
          alt={item.name}
          className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
        />
        <div>
          <h3 className="text-base font-bold text-emerald-950">{item.name}</h3>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="mt-2 inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </button>
        </div>
      </div>

      <div className="text-center text-base text-neutral-700">
        {formatCurrency(item.price)}/{item.unit}
      </div>

      <div className="flex justify-center">
        <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-stone-300">
          <button
            type="button"
            onClick={() => onDecrease(item.id)}
            className="px-3 text-emerald-950 hover:bg-zinc-100"
            aria-label={`Giảm số lượng ${item.name}`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="w-10 border-x border-stone-300 py-2 text-center text-base font-semibold text-zinc-900">
            {item.quantity}
          </div>
          <button
            type="button"
            onClick={() => onIncrease(item.id)}
            className="px-3 text-emerald-950 hover:bg-zinc-100"
            aria-label={`Tăng số lượng ${item.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-right text-base font-bold text-teal-800">
        {formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  );
}

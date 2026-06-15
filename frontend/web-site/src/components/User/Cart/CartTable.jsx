import CartItemRow from "./CartItemRow";

export default function CartTable({
  items,
  allSelected,
  onToggleAll,
  onToggleSelect,
  onDecrease,
  onIncrease,
  onRemove,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="grid grid-cols-[40px_1.6fr_1fr_1fr_1fr] items-center gap-4 bg-zinc-100 px-6 py-4 text-sm uppercase tracking-wide text-neutral-700">
        <div>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="h-4 w-4 rounded border-stone-400 text-teal-800 focus:ring-teal-700"
          />
        </div>
        <div>Sản phẩm</div>
        <div className="text-center">Đơn giá</div>
        <div className="text-center">Số lượng</div>
        <div className="text-right">Thành tiền</div>
      </div>

      <div>
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onToggleSelect={onToggleSelect}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

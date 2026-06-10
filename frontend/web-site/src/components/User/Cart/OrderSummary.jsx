import { formatCurrency } from "./mockData";

export default function OrderSummary({
  selectedCount,
  subtotal,
  shippingFee = 0,
  onCheckout,
}) {
  const total = subtotal + shippingFee;

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm">
      <h2 className="text-base font-normal text-emerald-950">Tóm tắt đơn hàng</h2>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base text-neutral-700">{selectedCount} sản phẩm</span>
          <span className="text-base font-semibold text-zinc-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-base text-neutral-700">Phí vận chuyển</span>
          <span className="text-base font-semibold text-teal-800">
            {formatCurrency(shippingFee)}
          </span>
        </div>

        <div className="h-px bg-stone-300/30" />

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-emerald-950">Tổng cộng</span>
          <span className="text-base font-bold text-teal-800">{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="mt-6 w-full rounded-lg bg-green-700 py-4 text-base font-bold text-white shadow-sm transition hover:bg-green-800"
      >
        Đặt hàng
      </button>
    </section>
  );
}

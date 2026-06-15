import { formatCurrency } from "./mockData";

export default function PaymentSummaryCard({
  subtotal,
  shippingFee,
  discount,
  onPay,
}) {
  const total = Math.max(0, subtotal + shippingFee - discount);

  return (
    <section className="rounded-xl bg-zinc-100 p-8 shadow-sm outline outline-1 outline-stone-300/20">
      <h2 className="text-2xl font-semibold text-emerald-950">Tóm tắt thanh toán</h2>

      <div className="py-4 space-y-4">
        <div className="flex justify-between">
          <span className="text-base text-zinc-900">Tạm tính</span>
          <span className="text-base text-zinc-900">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-base text-zinc-900">Phí vận chuyển</span>
          <span className="text-base font-bold text-teal-800">
            {shippingFee === 0 ? "0đ - Miễn phí" : formatCurrency(shippingFee)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-base text-zinc-900">Giảm giá voucher</span>
            <span className="text-base font-bold text-teal-800">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="h-px bg-stone-300/30" />

        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold text-zinc-900">Tổng cộng</span>
          <span className="text-4xl font-normal text-green-900">{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onPay}
        className="relative mt-2 w-full rounded-lg bg-green-900 px-6 py-4 text-center text-lg font-bold text-white transition hover:bg-green-950"
      >
        THANH TOÁN
      </button>
    </section>
  );
}

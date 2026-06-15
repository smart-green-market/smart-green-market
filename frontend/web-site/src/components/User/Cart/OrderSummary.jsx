import { Link } from "react-router-dom";
import { formatCurrency } from "./mockData";

export default function OrderSummary({
  selectedCount,
  subtotal,
  shippingFee = 0,
  onCheckout,
  sticky = false,
}) {
  const total = subtotal + shippingFee;

  return (
    <section
      className={`rounded-xl border border-stone-200 bg-white p-6 shadow-sm ${
        sticky ? "lg:sticky lg:top-[88px]" : ""
      }`}
    >
      <h2 className="text-lg font-semibold text-emerald-950">Tóm tắt đơn hàng</h2>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Sản phẩm đã chọn</span>
          <span className="font-medium text-zinc-900">{selectedCount}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Tạm tính</span>
          <span className="font-semibold text-zinc-900">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Phí vận chuyển</span>
          <span className="font-semibold text-teal-800">
            {shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}
          </span>
        </div>

        <div className="h-px bg-stone-200" />

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-emerald-950">Tổng cộng</span>
          <span className="text-xl font-bold text-teal-800">{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={selectedCount === 0}
        className="mt-5 w-full rounded-lg bg-emerald-800 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Đặt hàng
      </button>

      <Link
        to="/trang-chu"
        className="mt-4 block text-center text-sm text-teal-800 no-underline hover:text-teal-900"
      >
        Tiếp tục mua sắm
      </Link>
    </section>
  );
}

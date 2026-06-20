import { formatCurrency } from "../Cart/mockData";

export default function PaymentSummaryCard({
    subtotal,
    shippingFee,
    discount = 0,
    submitting = false,
    disabled = false,
    onPay,
}) {
    const total = Math.max(0, subtotal + shippingFee - discount);

    return (
        <section className="rounded-xl bg-zinc-100 p-6 shadow-sm outline outline-1 outline-stone-300/20 sm:p-8 lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                Tóm tắt thanh toán
            </h2>

            <div className="mt-5 space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-zinc-900">Tạm tính</span>
                    <span className="text-zinc-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-zinc-900">Phí vận chuyển</span>
                    <span className="font-semibold text-teal-800">
                        {formatCurrency(shippingFee)}
                    </span>
                </div>

                {discount > 0 ? (
                    <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-zinc-900">Giảm giá voucher</span>
                        <span className="font-semibold text-teal-800">
                            -{formatCurrency(discount)}
                        </span>
                    </div>
                ) : null}

                <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm">
                    <span className="text-neutral-600">Thanh toán</span>
                    <span className="font-medium text-emerald-900">COD — Khi nhận hàng</span>
                </div>

                <div className="h-px bg-stone-300/30" />

                <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-zinc-900">Tổng cộng</span>
                    <span className="text-2xl font-bold text-green-900 sm:text-3xl">
                        {formatCurrency(total)}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={onPay}
                disabled={disabled || submitting}
                className="mt-6 w-full rounded-lg bg-green-900 px-6 py-4 text-center text-base font-bold text-white transition hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang xử lý..." : "ĐẶT HÀNG"}
            </button>
        </section>
    );
}

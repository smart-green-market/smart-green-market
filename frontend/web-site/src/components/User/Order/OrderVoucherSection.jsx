import { Sparkles, Tag, Ticket } from "lucide-react";

export default function OrderVoucherSection({
    voucherCode = "",
    onVoucherCodeChange,
    appliedVoucher = null,
    disabled = true,
}) {
    return (
        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline outline-1 outline-stone-300/30">
            <div className="border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
                <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-emerald-800" />
                    <h3 className="text-lg font-semibold text-emerald-950">Mã ưu đãi</h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        Sắp ra mắt
                    </span>
                </div>
            </div>

            <div className="space-y-4 p-6">
                <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        value={voucherCode}
                        onChange={(event) => onVoucherCodeChange?.(event.target.value)}
                        disabled={disabled}
                        placeholder="Nhập mã voucher (ví dụ: GREEN10)"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-24 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <button
                        type="button"
                        disabled={disabled || !voucherCode.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                        Áp dụng
                    </button>
                </div>

                {appliedVoucher ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        Đã áp dụng: <strong>{appliedVoucher.code}</strong>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-zinc-50 px-4 py-5 text-center">
                        <Sparkles className="mx-auto h-5 w-5 text-emerald-600" />
                        <p className="mt-2 text-sm font-medium text-neutral-700">
                            Chưa có voucher khả dụng
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Tính năng voucher sẽ được kết nối API sau
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

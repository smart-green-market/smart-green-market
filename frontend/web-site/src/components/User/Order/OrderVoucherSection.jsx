import { useMemo } from "react";
import { Loader2, Search, Sparkles, Tag, Ticket, X } from "lucide-react";
import { formatCurrency } from "../Cart/mockData";
import {
    filterVouchersByQuery,
    findVoucherByCode,
    formatVoucherDiscountLabel,
    getVoucherEligibility,
} from "../../../utils/buyerOrderUtils";

export default function OrderVoucherSection({
    voucherCode = "",
    onVoucherCodeChange,
    appliedVoucher = null,
    availableVouchers = [],
    subtotal = 0,
    loading = false,
    applying = false,
    error = "",
    disabled = false,
    onApply,
    onRemove,
    onSelectVoucher,
}) {
    const searchQuery = voucherCode.trim();
    const matchedVoucher = useMemo(
        () => findVoucherByCode(availableVouchers, searchQuery),
        [availableVouchers, searchQuery],
    );
    const inputEligibility = useMemo(
        () =>
            matchedVoucher
                ? getVoucherEligibility(matchedVoucher, subtotal)
                : { eligible: true, minOrderAmount: 0, reason: "" },
        [matchedVoucher, subtotal],
    );
    const canApply =
        !disabled &&
        !applying &&
        !appliedVoucher &&
        searchQuery &&
        inputEligibility.eligible;
    const eligibilityMessage =
        !appliedVoucher && !inputEligibility.eligible ? inputEligibility.reason : "";
    const displayError = error || eligibilityMessage;
    const showRemoveButton = Boolean(appliedVoucher) || (Boolean(searchQuery) && Boolean(displayError));

    const filteredVouchers = useMemo(
        () => filterVouchersByQuery(availableVouchers, searchQuery),
        [availableVouchers, searchQuery],
    );
    const isSearching = searchQuery.length > 0;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (canApply) onApply?.();
    };

    return (
        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline outline-1 outline-stone-300/30">
            <div className="border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
                <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-emerald-800" />
                    <h3 className="text-lg font-semibold text-emerald-950">Mã ưu đãi</h3>
                </div>
            </div>

            <div className="space-y-4 p-6">
                <form onSubmit={handleSubmit} className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        value={voucherCode}
                        onChange={(event) => onVoucherCodeChange?.(event.target.value)}
                        disabled={disabled || applying || Boolean(appliedVoucher)}
                        placeholder="Tìm hoặc nhập mã voucher (ví dụ: GIAMGIA10K)"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-24 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    {showRemoveButton ? (
                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={disabled || applying}
                            className="cursor-pointer absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!canApply}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                            {applying ? (
                                <span className="inline-flex items-center gap-1">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ...
                                </span>
                            ) : (
                                "Áp dụng"
                            )}
                        </button>
                    )}
                </form>

                {displayError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {displayError}
                    </div>
                ) : null}

                {appliedVoucher ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        <p>
                            Đã áp dụng: <strong>{appliedVoucher.code}</strong>
                        </p>
                        {appliedVoucher.title ? (
                            <p className="mt-1 text-emerald-800">{appliedVoucher.title}</p>
                        ) : null}
                        {appliedVoucher.discountAmount > 0 ? (
                            <p className="mt-1 font-semibold text-emerald-900">
                                Giảm {formatCurrency(appliedVoucher.discountAmount)}
                            </p>
                        ) : null}
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-zinc-50 px-4 py-5 text-sm text-neutral-600">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                        Đang tải voucher khả dụng...
                    </div>
                ) : availableVouchers.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                {isSearching ? "Kết quả tìm kiếm" : "Voucher khả dụng"}
                            </p>
                            {isSearching ? (
                                <span className="text-xs text-neutral-500">
                                    {filteredVouchers.length}/{availableVouchers.length}
                                </span>
                            ) : null}
                        </div>

                        {filteredVouchers.length > 0 ? (
                            <ul className="max-h-48 space-y-2 overflow-y-auto">
                                {filteredVouchers.map((voucher) => (
                                    <li key={voucher.id ?? voucher.code}>
                                        <button
                                            type="button"
                                            disabled={disabled || applying}
                                            onClick={() => onSelectVoucher?.(voucher)}
                                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-emerald-950">
                                                        {voucher.code}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-neutral-600">
                                                        {formatVoucherDiscountLabel(voucher)}
                                                    </p>
                                                    {voucher.description ? (
                                                        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                                                            {voucher.description}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="rounded-xl border border-dashed border-stone-200 bg-zinc-50 px-4 py-5 text-center">
                                <p className="text-sm font-medium text-neutral-700">
                                    Không tìm thấy voucher phù hợp
                                </p>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Thử mã khác hoặc bấm Áp dụng để kiểm tra mã bạn nhập
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-zinc-50 px-4 py-5 text-center">
                        <Sparkles className="mx-auto h-5 w-5 text-emerald-600" />
                        <p className="mt-2 text-sm font-medium text-neutral-700">
                            Chưa có voucher khả dụng
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Bạn vẫn có thể nhập mã voucher nếu đã có
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

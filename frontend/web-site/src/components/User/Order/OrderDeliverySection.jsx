import { CalendarClock, Loader2 } from "lucide-react";

export default function OrderDeliverySection({
    dates = [],
    loading = false,
    error = "",
    selectedDate = "",
    selectedSlot = "",
    onSelectDate,
    onSelectSlot,
}) {
    const activeDate = dates.find((entry) => entry.date === selectedDate) ?? dates[0];

    return (
        <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-stone-300/30 sm:p-8">
            <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-emerald-950" />
                <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                    Thời gian giao hàng
                </h2>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
                Chọn ngày và khung giờ giao phù hợp
            </p>

            {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="mt-6 flex h-24 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                </div>
            ) : dates.length === 0 ? (
                <p className="mt-6 text-sm text-neutral-500">
                    Hiện chưa có khung giờ giao hàng khả dụng.
                </p>
            ) : (
                <div className="mt-6 space-y-5">
                    <div className="flex flex-wrap gap-2">
                        {dates.map((entry) => (
                            <button
                                key={entry.date}
                                type="button"
                                onClick={() => onSelectDate?.(entry.date)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                    selectedDate === entry.date
                                        ? "bg-emerald-900 text-white"
                                        : "bg-stone-100 text-neutral-700 hover:bg-stone-200"
                                }`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>

                    {activeDate ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {activeDate.slots.map((slot) => {
                                const isSelected =
                                    selectedSlot === slot.id && slot.available;

                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => {
                                            if (!slot.available) return;
                                            onSelectSlot?.(slot.id);
                                        }}
                                        disabled={!slot.available}
                                        aria-disabled={!slot.available}
                                        className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                                            isSelected
                                                ? "border-emerald-800 bg-emerald-50"
                                                : slot.available
                                                  ? "border-stone-200 bg-white hover:border-emerald-300"
                                                  : "cursor-not-allowed border-stone-200 bg-stone-50 opacity-70"
                                        }`}
                                    >
                                        <p
                                            className={`text-sm font-semibold ${
                                                slot.available
                                                    ? "text-emerald-950"
                                                    : "text-neutral-500"
                                            }`}
                                        >
                                            {slot.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-500">
                                            {slot.available
                                                ? "Còn slot trống"
                                                : "Đã hết slot"}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            )}
        </section>
    );
}

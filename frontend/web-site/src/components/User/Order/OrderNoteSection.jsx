import { MessageSquareText } from "lucide-react";

export default function OrderNoteSection({ value = "", onChange, maxLength = 300 }) {
    return (
        <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-stone-300/30 sm:p-8">
            <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-emerald-950" />
                <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                    Ghi chú đơn hàng
                </h2>
            </div>
            <textarea
                value={value}
                onChange={(event) => onChange?.(event.target.value.slice(0, maxLength))}
                rows={3}
                placeholder="Ví dụ: Giao buổi sáng, gọi trước khi tới..."
                className="mt-4 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-2 text-right text-xs text-neutral-400">
                {value.length}/{maxLength}
            </p>
        </section>
    );
}

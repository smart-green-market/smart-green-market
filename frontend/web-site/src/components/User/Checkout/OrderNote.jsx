import React from "react";
import { MessageSquare } from "lucide-react";

/**
 * OrderNote
 * Textarea để khách hàng để lại lời nhắn cho đơn hàng.
 *
 * Props:
 * - value: string
 * - onChange: (value: string) => void
 */
export default function OrderNote({ value, onChange }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <MessageSquare size={18} />
        </span>
        <h2 className="text-lg font-bold text-slate-800">Lời nhắn cho shop</h2>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi đến..."
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
      />
    </section>
  );
}

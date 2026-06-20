import React from "react";
import { Wallet, Banknote, CreditCard } from "lucide-react";

const ICONS = {
  cod: Banknote,
  bank: CreditCard,
  wallet: Wallet,
};

/**
 * PaymentMethodSelector
 * Chọn phương thức thanh toán cho đơn hàng.
 *
 * Props:
 * - methods: Array<{ id, label, description }>
 * - selectedId: id phương thức đang chọn
 * - onSelect: (id) => void
 */
export default function PaymentMethodSelector({
  methods = [],
  selectedId,
  onSelect,
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-800">
        Phương thức thanh toán
      </h2>

      <div className="grid gap-3 sm:grid-cols-3">
        {methods.map((method) => {
          const Icon = ICONS[method.id] || Wallet;
          const isSelected = method.id === selectedId;
          return (
            <label
              key={method.id}
              className={`flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-4 transition ${
                isSelected
                  ? "border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isSelected
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <input
                  type="radio"
                  name="payment-method"
                  className="h-4 w-4 accent-emerald-800"
                  checked={isSelected}
                  onChange={() => onSelect(method.id)}
                />
              </div>
              <div>
                <p className="font-medium text-slate-800">{method.label}</p>
                <p className="text-xs text-slate-400">
                  {method.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

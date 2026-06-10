import { ChevronDown, Ticket } from "lucide-react";

export default function VoucherCard({ vouchers, selectedVoucherId, onChangeVoucher }) {
  return (
    <div className="rounded-xl bg-white p-6 outline outline-1 outline-stone-300/30">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-emerald-950" />
        <h3 className="text-2xl font-semibold text-emerald-950">Voucher</h3>
      </div>

      <div className="mt-4 rounded-lg bg-emerald-950/5 p-3 outline outline-1 outline-emerald-950/40">
        <label htmlFor="voucher-select" className="mb-2 block text-sm text-emerald-950">
          Chọn mã voucher
        </label>
        <div className="relative">
          <select
            id="voucher-select"
            value={selectedVoucherId}
            onChange={(e) => onChangeVoucher(e.target.value)}
            className="w-full appearance-none rounded-lg border border-transparent bg-transparent py-1 pr-8 text-sm text-emerald-950 outline-none"
          >
            {vouchers.map((voucher) => (
              <option key={voucher.id} value={voucher.id}>
                {voucher.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-950" />
        </div>
      </div>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";

export default function BankingDetailsCard({ bankingInfo }) {
  return (
    <section className="overflow-hidden rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-stone-300/20">
      <div className="rounded-xl bg-zinc-100 pb-6 pt-8 flex flex-col items-center">
        <div className="relative rounded-xl bg-white p-4 outline outline-1 outline-stone-300/30">
          <img
            src={bankingInfo.qrImage}
            alt="QR thanh toán"
            className="h-60 w-60 rounded-lg border-2 border-teal-800/30 object-cover"
          />
        </div>

        <div className="pt-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
            Thông tin người nhận:
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-950">
            {bankingInfo.receiverName}
          </p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-800/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-teal-800" />
            <span className="text-sm font-bold text-teal-800">{bankingInfo.transferCode}</span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm font-normal text-neutral-700">{bankingInfo.note}</p>
    </section>
  );
}

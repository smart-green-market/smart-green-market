import { MapPin } from "lucide-react";

export default function ShippingAddressCard({ address }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-stone-300/20">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-teal-800" />
        <h2 className="text-2xl font-semibold text-zinc-900">Địa chỉ giao hàng</h2>
      </div>

      <div className="mt-4 rounded-lg bg-neutral-100 p-5 outline outline-1 outline-stone-300/10">
        <div className="flex items-start justify-between">
          <p className="text-base font-normal text-neutral-700">Người nhận:</p>
          <p className="text-base font-semibold text-zinc-900">{address.receiver}</p>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <p className="text-base font-normal text-neutral-700">Số điện thoại:</p>
          <p className="text-base font-semibold text-zinc-900">{address.phone}</p>
        </div>
        <div className="mt-4">
          <p className="text-base font-normal text-neutral-700">Địa chỉ chi tiết:</p>
          <p className="mt-1 text-sm font-normal text-neutral-700">{address.detail}</p>
        </div>
      </div>
    </section>
  );
}

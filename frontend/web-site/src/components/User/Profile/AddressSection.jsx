import { Plus } from "lucide-react";
import AddressRadioCard from "./AddressRadioCard";

export default function AddressSection({
  addresses,
  selectedAddressId,
  onChangeAddress,
  onAddAddress,
  onEditAddress,
}) {
  return (
    <section className="rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-zinc-100">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-emerald-950">Địa chỉ nhận hàng</h2>
        <button
          type="button"
          onClick={onAddAddress}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-6 py-2 text-sm font-semibold tracking-wide text-white hover:bg-green-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm địa chỉ mới
        </button>
      </div>

      <div className="mt-8 max-h-64 space-y-4 overflow-y-auto p-2">
        {addresses.map((address) => (
          <AddressRadioCard
            key={address.id}
            address={address}
            checked={selectedAddressId === address.id}
            onChange={onChangeAddress}
            onEditAddress={onEditAddress}
          />
        ))}
      </div>
    </section>
  );
}

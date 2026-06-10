import { MapPin, PlusCircle } from "lucide-react";
import AddressCard from "./AddressCard";

export default function ShippingAddressSection({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-emerald-950" />
        <h2 className="text-2xl font-semibold text-emerald-950">Địa chỉ giao hàng</h2>
      </div>

      <div className="mt-5 space-y-6">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            selected={address.id === selectedAddressId}
            onSelect={onSelectAddress}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddAddress}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-base font-bold text-emerald-950 outline outline-2 outline-emerald-950 hover:bg-emerald-50"
      >
        <PlusCircle className="h-5 w-5" />
        Thêm địa chỉ mới
      </button>
    </section>
  );
}

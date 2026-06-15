import { Pencil } from "lucide-react";

export default function AddressRadioCard({
  address,
  checked,
  onChange,
  onEditAddress,
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between rounded-xl px-6 pb-6 pt-9 outline outline-2 ${
        checked ? "bg-green-50 outline-teal-800" : "bg-zinc-100 outline-transparent"
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          type="radio"
          name="shipping-address"
          checked={checked}
          onChange={() => onChange(address.id)}
          className="mt-1 h-5 w-5 accent-teal-800"
        />
        <div>
          <p className="text-base font-medium text-zinc-900">
            {address.receiver} | {address.phone}
          </p>
          <p className="text-sm text-neutral-700">{address.detail}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onEditAddress(address);
        }}
        className="rounded-md p-2 text-neutral-500 hover:bg-white hover:text-teal-800"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </label>
  );
}

export default function AddressCard({ address, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(address.id)}
      className={`w-full rounded-xl p-6 text-left outline outline-2 outline-offset-[-2px] transition ${
        selected
          ? "bg-gray-100 outline-emerald-950"
          : "bg-white outline-stone-300 hover:outline-emerald-700"
      }`}
    >
      <p className="text-base font-bold text-emerald-950">{address.name}</p>
      <p className="mt-1 text-sm text-zinc-900">{address.phone}</p>
      <p className="mt-1 text-sm text-neutral-700">{address.address}</p>
    </button>
  );
}

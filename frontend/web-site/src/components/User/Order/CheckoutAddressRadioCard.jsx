export default function CheckoutAddressRadioCard({
    address,
    checked,
    disabled = false,
    onSelect,
}) {
    return (
        <label
            className={`flex cursor-pointer items-start gap-4 rounded-xl px-5 py-5 outline outline-2 transition-colors ${
                checked
                    ? "bg-green-50 outline-teal-800"
                    : "bg-zinc-100 outline-transparent hover:bg-zinc-50"
            } ${disabled ? "opacity-70" : ""}`}
        >
            <input
                type="radio"
                name="checkout-shipping-address"
                checked={checked}
                disabled={disabled}
                onChange={() => onSelect?.(address.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-teal-800"
            />
            <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium text-zinc-900">
                        {address.receiver_name} | {address.receiver_phone}
                    </p>
                    {address.is_default ? (
                        <span className="rounded-full bg-teal-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Mặc định
                        </span>
                    ) : null}
                </div>
                <p className="text-sm leading-relaxed text-neutral-700">{address.address}</p>
            </div>
        </label>
    );
}

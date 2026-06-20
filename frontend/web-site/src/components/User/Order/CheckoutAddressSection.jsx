import { Loader2, Plus } from "lucide-react";
import CheckoutAddressRadioCard from "./CheckoutAddressRadioCard";

export default function CheckoutAddressSection({
    addresses = [],
    selectedAddressId,
    loading = false,
    saving = false,
    error = "",
    canAddMore = true,
    maxAddresses = 5,
    onSelectAddress,
    onAddAddress,
}) {
    return (
        <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-zinc-100 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                        Địa chỉ giao hàng
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Chọn địa chỉ nhận hàng • Tối đa {maxAddresses} địa chỉ
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAddAddress}
                    disabled={!canAddMore || saving}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm địa chỉ mới
                </button>
            </div>

            {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="mt-6 max-h-64 space-y-4 overflow-y-auto p-1">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-zinc-50 px-4 py-10 text-center text-sm text-neutral-500">
                        Chưa có địa chỉ nhận hàng. Hãy thêm địa chỉ mới để đặt hàng.
                    </div>
                ) : (
                    addresses.map((address) => (
                        <CheckoutAddressRadioCard
                            key={address.id}
                            address={address}
                            checked={String(selectedAddressId) === String(address.id)}
                            disabled={saving}
                            onSelect={onSelectAddress}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

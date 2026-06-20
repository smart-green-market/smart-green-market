import { Loader2, Plus } from "lucide-react";
import AddressRadioCard from "./AddressRadioCard";

export default function AddressSection({
    addresses = [],
    defaultAddressId,
    loading = false,
    saving = false,
    error = "",
    canAddMore = true,
    maxAddresses = 5,
    onAddAddress,
    onSetDefault,
    onViewAddress,
    onEditAddress,
    onDeleteAddress,
}) {
    return (
        <section className="rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-zinc-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold text-emerald-950">
                        Địa chỉ nhận hàng
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Tối đa {maxAddresses} địa chỉ • Chọn để đặt làm địa chỉ mặc định
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAddAddress}
                    disabled={!canAddMore || saving}
                    className="hover:scale-105 cursor-pointer inline-flex items-center gap-2 rounded-lg bg-green-700 px-6 py-2 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
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

            <div className="mt-8 max-h-64 space-y-4 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-zinc-50 px-4 py-10 text-center text-sm text-neutral-500">
                        Chưa có địa chỉ nhận hàng. Hãy thêm địa chỉ mới.
                    </div>
                ) : (
                    addresses.map((address) => (
                        <AddressRadioCard
                            key={address.id}
                            address={address}
                            checked={String(defaultAddressId) === String(address.id)}
                            disabled={saving}
                            onSetDefault={onSetDefault}
                            onView={onViewAddress}
                            onEdit={onEditAddress}
                            onDelete={onDeleteAddress}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

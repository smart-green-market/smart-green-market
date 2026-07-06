import { Loader2, MapPin, Plus } from "lucide-react";
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
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                        <MapPin className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                        <h2 className="text-[18px] font-bold text-zinc-900">
                            Địa chỉ nhận hàng
                        </h2>
                        <p className="text-[13px] text-neutral-500">
                            Tối đa {maxAddresses} địa chỉ • Chọn để đặt làm địa chỉ mặc định
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onAddAddress}
                    disabled={!canAddMore || saving}
                    className="hover:scale-105 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm địa chỉ mới
                </button>
            </div>

            {error ? (
                <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="px-6 pt-1 pb-6 max-h-72 space-y-3 overflow-y-auto">
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

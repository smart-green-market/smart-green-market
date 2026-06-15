export default function InfoField({ label, value }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-base">
                {label}
            </label>

            <div className="px-4 py-3 rounded-xl border border-neutral-200 bg-stone-100 text-sm text-zinc-900">
                {value || "-"}
            </div>
        </div>
    );
}
export default function InfoField({ label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {label}
            </label>

            <div className="px-4 py-3 rounded-xl border border-neutral-200 bg-stone-100 text-sm text-zinc-900">
                {value || "-"}
            </div>
        </div>
    );
}
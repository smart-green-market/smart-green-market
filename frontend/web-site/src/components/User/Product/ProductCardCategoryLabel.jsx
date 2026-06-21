export default function ProductCardCategoryLabel({ label = "" }) {
    if (!label) return null;

    return (
        <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {label}
        </p>
    );
}

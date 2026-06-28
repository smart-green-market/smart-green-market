export default function ProductDiscountRibbon({ percent, className = "" }) {
    const value = Number(percent);
    if (!value || value <= 0 || Number.isNaN(value)) return null;

    const label = `-${Math.round(value)}%`;

    return (
        <div
            className={`pointer-events-none absolute left-0 top-0 z-10 h-24 w-24 overflow-hidden ${className}`}
            aria-hidden
        >
            <span className="absolute left-[-30px] top-[20px] flex w-[124px] -rotate-45 items-center justify-center bg-red-600 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                {label}
            </span>
        </div>
    );
}

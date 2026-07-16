import { getPreOrderStatusMeta } from "../../utils/preorderStatusConfig";

export default function PreOrderStatusSummary({
  counts = {},
  audience = "buyer",
  activeFilter = "",
  onFilterChange,
  filters = [],
}) {
  if (!filters.length) return null;

  const colCount = Math.min(filters.length, 6);

  return (
    <div
      className="grid w-full gap-2"
      style={{
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        const count = counts[filter.countKey] ?? 0;
        const meta =
          filter.value && getPreOrderStatusMeta(filter.value, audience);

        return (
          <button
            key={filter.value || "all"}
            type="button"
            onClick={() => onFilterChange?.(filter.value)}
            className={`relative flex min-h-[72px] w-full min-w-0 flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-center transition-all ${
              isActive
                ? "border-emerald-300 bg-white shadow-sm ring-1 ring-emerald-100"
                : "border-transparent bg-white/80 hover:border-stone-200 hover:bg-white"
            }`}
          >
            <p
              className={`text-xl font-extrabold leading-none tabular-nums ${
                isActive
                  ? "text-emerald-800"
                  : filter.color ?? "text-neutral-800"
              }`}
            >
              {count}
            </p>
            <p className="mt-1 w-full truncate text-[11px] font-semibold text-neutral-600">
              {filter.label}
            </p>
            {meta && isActive ? (
              <span
                className={`absolute bottom-2 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full ${meta.accent}`}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

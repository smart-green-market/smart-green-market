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
      className="grid gap-2"
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
            className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
              isActive
                ? "border-emerald-300 bg-white shadow-sm ring-1 ring-emerald-100"
                : "border-transparent bg-white/80 hover:border-stone-200 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p
                className={`text-xl font-extrabold leading-none tabular-nums ${
                  isActive
                    ? "text-emerald-800"
                    : filter.color ?? "text-neutral-800"
                }`}
              >
                {count}
              </p>
              {meta && isActive ? (
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${meta.accent}`}
                />
              ) : null}
            </div>
            <p className="mt-1 truncate text-[11px] font-semibold text-neutral-600">
              {filter.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}

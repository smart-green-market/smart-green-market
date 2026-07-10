import { getPreOrderStatusMeta } from "../../utils/preorderStatusConfig";

export default function PreOrderStatusSummary({
  counts = {},
  audience = "buyer",
  activeFilter = "",
  onFilterChange,
  filters = [],
}) {
  if (!filters.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition-all ${
              isActive
                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                : "border-stone-200 bg-white hover:border-emerald-200"
            }`}
          >
            <p
              className={`text-2xl font-extrabold leading-none ${
                isActive ? "text-emerald-800" : filter.color ?? "text-neutral-800"
              }`}
            >
              {count}
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-600">
              {filter.label}
            </p>
            {meta && count > 0 ? (
              <span
                className={`mt-2 inline-block h-1.5 w-8 rounded-full ${meta.accent}`}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

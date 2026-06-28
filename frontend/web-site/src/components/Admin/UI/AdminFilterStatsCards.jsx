import { CATEGORY_STAT_CARDS } from "./adminFilterStatsPresets";

const GRID_COLS_CLASS = {
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
};

function FilterStatCard({
    card,
    count,
    isActive,
    onClick,
    loading,
}) {
    const Icon = card.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isActive}
            className={[
                "group flex min-h-[96px] w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all",
                "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2",
                isActive
                    ? `${card.activeBorder ?? "border-emerald-400"} ring-2 ${card.activeRing ?? "ring-emerald-500/30"}`
                    : "border-neutral-200 hover:border-neutral-300",
            ].join(" ")}
        >
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
            >
                <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-sm font-medium text-neutral-600 font-['Geist',sans-serif]">
                    {card.label}
                </p>
                <p
                    className={`text-[28px] font-bold leading-none tabular-nums tracking-tight font-['Geist',sans-serif] ${card.valueColor}`}
                >
                    {loading ? "—" : (count ?? 0)}
                </p>
            </div>
        </button>
    );
}

/**
 * 4 card thống kê có thể click để đồng bộ filter trên page.
 *
 * @param {Object} props
 * @param {Object} props.counts - { active: 5, inactive: 2, ... } keyed theo card.key
 * @param {Array} [props.cards] - Cấu hình card (mặc định ADMIN_STATUS_STAT_CARDS)
 * @param {string} props.activeFilter - Filter hiện tại trên page
 * @param {(filterValue: string) => void} props.onFilterChange - setStatusFilter(...)
 * @param {boolean} [props.loading] - Hiển thị placeholder khi đang fetch count
 * @param {string} [props.className]
 */
export default function AdminFilterStatsCards({
    counts = {},
    cards = CATEGORY_STAT_CARDS,
    activeFilter,
    onFilterChange,
    loading = false,
    className = "",
}) {
    const gridCols = GRID_COLS_CLASS[cards.length] ?? "xl:grid-cols-4";

    return (
        <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${gridCols} ${className}`}
        >
            {cards.map((card) => {
                const filterValue = card.filterValue ?? card.key;
                const isActive = activeFilter === filterValue;

                return (
                    <FilterStatCard
                        key={card.key}
                        card={card}
                        count={counts[card.key]}
                        isActive={isActive}
                        loading={loading}
                        onClick={() => onFilterChange(filterValue)}
                    />
                );
            })}
        </div>
    );
}

export {
    CATEGORY_STAT_CARDS,
    ADMIN_STATUS_STAT_CARDS,
    SUPPLIER_STAT_CARDS,
    DEALER_STAT_CARDS,
    PRODUCT_STAT_CARDS,
    CERTIFICATION_STAT_CARDS,
    DOCUMENT_STAT_CARDS,
} from "./adminFilterStatsPresets";

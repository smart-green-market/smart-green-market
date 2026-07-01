import { Plus } from "lucide-react";
import SearchBar from "./SearchBar";

/**
 * Toolbar — search + filter dropdown + optional secondary/add CTAs
 */
export default function Toolbar({
    search,
    onSearch,
    onAdd,
    addLabel = "Thêm mới",
    searchPlaceholder,
    filter = null,
    secondaryAction = null,
}) {
    return (
        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto">
                <SearchBar
                    value={search}
                    onChange={onSearch}
                    placeholder={searchPlaceholder}
                />
                {filter}
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {secondaryAction}
                {onAdd ? (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 font-['Geist',sans-serif]"
                    >
                        <Plus className="h-4 w-4" />
                        {addLabel}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

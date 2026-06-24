import { Plus } from "lucide-react";
import SearchBar from "./SearchBar";

/**
 * Toolbar — search + filter dropdown + optional add CTA
 */
export default function Toolbar({
    search,
    onSearch,
    onAdd,
    addLabel = "Thêm mới",
    searchPlaceholder,
    filter = null,
}) {
    return (
        <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
                <SearchBar
                    value={search}
                    onChange={onSearch}
                    placeholder={searchPlaceholder}
                />
                {filter}
            </div>
            {onAdd ? (
                <button
                    type="button"
                    onClick={onAdd}
                    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 font-['Geist',sans-serif]"
                >
                    <Plus className="h-4 w-4" />
                    {addLabel}
                </button>
            ) : null}
        </div>
    );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Leaf, Search, X } from "lucide-react";

export default function CategoryCheckboxDropdown({
    categories = [],
    selectedIds = [],
    onChange,
    loading = false,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    const selectedSet = useMemo(
        () => new Set(selectedIds.map(String)),
        [selectedIds],
    );

    const filteredCategories = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return categories;
        return categories.filter((item) =>
            item.name.toLowerCase().includes(keyword),
        );
    }, [categories, search]);

    const displayLabel = useMemo(() => {
        if (selectedIds.length === 0) {
            return "Chọn danh mục";
        }

        if (selectedIds.length === 1) {
            const match = categories.find(
                (item) => String(item.id) === String(selectedIds[0]),
            );
            return match?.name ?? "1 danh mục";
        }

        return `${selectedIds.length} danh mục đã chọn`;
    }, [categories, selectedIds]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
                setSearch("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleCategory = (id) => {
        const key = String(id);
        const next = selectedSet.has(key)
            ? selectedIds.filter((item) => String(item) !== key)
            : [...selectedIds, key];
        onChange?.(next);
    };

    const clearSelection = () => {
        onChange?.([]);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                disabled={loading}
                onClick={() => setOpen((prev) => !prev)}
                className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    open
                        ? "border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-100"
                        : selectedIds.length > 0
                          ? "border-emerald-300 bg-emerald-50/60 hover:border-emerald-500"
                          : "border-stone-200 bg-stone-50/80 hover:border-emerald-400 hover:bg-white"
                }`}
            >
                <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                    <span
                        className={`truncate ${selectedIds.length > 0 ? "font-semibold text-emerald-900" : ""}`}
                    >
                        {loading ? "Đang tải..." : displayLabel}
                    </span>
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {selectedIds.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedIds.map((id) => {
                        const category = categories.find(
                            (item) => String(item.id) === String(id),
                        );
                        if (!category) return null;

                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
                            >
                                {category.name}
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(id)}
                                    className="cursor-pointer rounded-full p-0.5 transition hover:bg-emerald-200/80"
                                    aria-label={`Bỏ chọn ${category.name}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            ) : null}

            {open && !loading ? (
                <div className="absolute left-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-[0_12px_40px_rgba(6,78,59,0.12)]">
                    {categories.length === 0 ? (
                        <p className="px-4 py-5 text-center text-sm text-neutral-500">
                            Chưa có danh mục.
                        </p>
                    ) : (
                        <>
                    <div className="border-b border-emerald-50 bg-gradient-to-r from-emerald-50/80 to-white p-2.5">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600/70" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm danh mục rau, củ, quả..."
                                autoFocus
                                className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto p-1.5">
                        {filteredCategories.length === 0 ? (
                            <p className="px-3 py-4 text-center text-sm text-neutral-500">
                                Không tìm thấy danh mục phù hợp.
                            </p>
                        ) : (
                            filteredCategories.map((category) => {
                                const id = String(category.id);
                                const checked = selectedSet.has(id);

                                return (
                                    <label
                                        key={category.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                                            checked
                                                ? "bg-emerald-50"
                                                : "hover:bg-stone-50"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleCategory(category.id)}
                                            className="h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block truncate text-sm ${
                                                    checked
                                                        ? "font-semibold text-emerald-900"
                                                        : "text-neutral-700"
                                                }`}
                                            >
                                                {category.name}
                                            </span>
                                            {category.product_count != null ? (
                                                <span className="text-[11px] text-neutral-400">
                                                    {category.product_count} sản phẩm
                                                </span>
                                            ) : null}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>

                    {selectedIds.length > 0 ? (
                        <div className="flex justify-end border-t border-emerald-50 px-3 py-2">
                            <button
                                type="button"
                                onClick={clearSelection}
                                className="cursor-pointer text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
                            >
                                Xóa lựa chọn
                            </button>
                        </div>
                    ) : null}
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
}

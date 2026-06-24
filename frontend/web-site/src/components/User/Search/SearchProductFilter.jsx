import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown, Search, Tag, X } from "lucide-react";

export const SEARCH_ORDER_OPTIONS = [
    { value: "-updated_at", label: "Mới nhất" },
    { value: "name", label: "Tên A → Z" },
    { value: "-name", label: "Tên Z → A" },
    { value: "price", label: "Giá thấp → cao" },
    { value: "-price", label: "Giá cao → thấp" },
    { value: "stock", label: "Tồn kho tăng dần" },
    { value: "-stock", label: "Tồn kho giảm dần" },
];

function CategoryDropdown({
    value,
    onChange,
    categories = [],
    loading = false,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    const selected = categories.find(
        (item) => String(item.id) === String(value),
    );
    const displayLabel = selected?.name ?? "Tất cả danh mục";

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return categories;
        return categories.filter((item) =>
            item.name.toLowerCase().includes(keyword),
        );
    }, [categories, search]);

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

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                disabled={loading}
                onClick={() => setOpen((prev) => !prev)}
                className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-stone-50/50 px-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    open
                        ? "border-emerald-600 bg-white ring-2 ring-emerald-100"
                        : "border-stone-200 hover:border-emerald-400 hover:bg-white"
                }`}
            >
                <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                    <Tag className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="truncate">
                        {loading ? "Đang tải..." : displayLabel}
                    </span>
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && !loading ? (
                <div className="absolute left-0 z-30 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                    <div className="border-b border-stone-100 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Tìm danh mục..."
                                autoFocus
                                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto p-1">
                        <button
                            type="button"
                            onClick={() => handleSelect("")}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                !value
                                    ? "bg-emerald-50 font-semibold text-emerald-800"
                                    : "text-neutral-700 hover:bg-stone-50"
                            }`}
                        >
                            <span>Tất cả danh mục</span>
                            {!value ? (
                                <Check className="h-4 w-4 text-emerald-700" />
                            ) : null}
                        </button>

                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-neutral-500">
                                Không tìm thấy danh mục.
                            </p>
                        ) : (
                            filtered.map((item) => {
                                const isActive =
                                    String(item.id) === String(value);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelect(String(item.id))
                                        }
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                            isActive
                                                ? "bg-emerald-50 font-semibold text-emerald-800"
                                                : "text-neutral-700 hover:bg-stone-50"
                                        }`}
                                    >
                                        <span className="truncate">
                                            {item.name}
                                        </span>
                                        {isActive ? (
                                            <Check className="h-4 w-4 shrink-0 text-emerald-700" />
                                        ) : null}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SortDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const selected =
        SEARCH_ORDER_OPTIONS.find((option) => option.value === value) ??
        SEARCH_ORDER_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full lg:w-[220px]">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 text-sm font-medium transition-all ${
                    open
                        ? "border-emerald-600 ring-2 ring-emerald-100"
                        : "border-stone-200 hover:border-emerald-400"
                }`}
            >
                <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                    <ArrowUpDown className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="truncate">{selected.label}</span>
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open ? (
                <div className="absolute right-0 z-30 mt-2 w-full min-w-[220px] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                    {SEARCH_ORDER_OPTIONS.map((option) => {
                        const isActive = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                                    isActive
                                        ? "bg-emerald-50 font-semibold text-emerald-800"
                                        : "text-neutral-700 hover:bg-stone-50"
                                }`}
                            >
                                <span>{option.label}</span>
                                {isActive ? (
                                    <Check className="h-4 w-4 text-emerald-700" />
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export default function SearchProductFilter({
    input,
    onInputChange,
    ordering,
    onOrderingChange,
    category,
    onCategoryChange,
    categories = [],
    loadingCategories = false,
    onSubmit,
}) {
    return (
        <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_200px_220px_auto] lg:items-end">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Từ khóa
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="search"
                            value={input}
                            onChange={(event) =>
                                onInputChange(event.target.value)
                            }
                            placeholder="Tìm kiếm thực phẩm sạch..."
                            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-neutral-400 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                        />
                        {input ? (
                            <button
                                type="button"
                                onClick={() => onInputChange("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-stone-100 hover:text-neutral-600"
                                aria-label="Xóa từ khóa"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Danh mục
                    </label>
                    <CategoryDropdown
                        value={category}
                        onChange={onCategoryChange}
                        categories={categories}
                        loading={loadingCategories}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Sắp xếp
                    </label>
                    <SortDropdown
                        value={ordering}
                        onChange={onOrderingChange}
                    />
                </div>

                <button
                    type="submit"
                    className="h-11 rounded-xl bg-emerald-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 lg:w-auto"
                >
                    Tìm kiếm
                </button>
            </div>
        </form>
    );
}

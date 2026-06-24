import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { categoryService } from "../../../services/api/categoryService";
import { CATEGORY_SCOPE } from "../Category/categoryHelpers";

export default function CategorySearchSelect({
    value,
    onChange,
    selectedLabel = "",
    disabled = false,
    placeholder = "Chọn danh mục...",
}) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const fetchCategories = async () => {
            try {
                setLoading(true);
                setLoadError("");
                const list = await categoryService.getAll();
                if (cancelled) return;

                const systemActive = (list ?? []).filter(
                    (item) =>
                        item.scope === CATEGORY_SCOPE.SYSTEM &&
                        item.status === "active",
                );
                setCategories(systemActive);
            } catch {
                if (!cancelled) {
                    setLoadError("Không thể tải danh sách danh mục.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (open || (value && categories.length === 0)) {
            fetchCategories();
        }

        return () => {
            cancelled = true;
        };
    }, [open, value, categories.length]);

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

    const selected = categories.find(
        (item) => String(item.id) === String(value),
    );
    const displayLabel = selected?.name || selectedLabel || placeholder;

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return categories;
        return categories.filter((item) =>
            item.name.toLowerCase().includes(keyword),
        );
    }, [categories, search]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-neutral-50"
            >
                <span
                    className={
                        selected || selectedLabel
                            ? "text-neutral-900"
                            : "text-neutral-400"
                    }
                >
                    {displayLabel}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open ? (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                    <div className="border-b border-neutral-100 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm danh mục..."
                                autoFocus
                                className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto p-1">
                        {loading ? (
                            <p className="px-3 py-2 text-sm text-neutral-500">
                                Đang tải danh mục...
                            </p>
                        ) : null}

                        {loadError ? (
                            <p className="px-3 py-2 text-sm text-red-600">
                                {loadError}
                            </p>
                        ) : null}

                        {!loading && !loadError && filtered.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-neutral-500">
                                Không tìm thấy danh mục.
                            </p>
                        ) : null}

                        {!loading && !loadError
                            ? filtered.map((item) => {
                                  const isSelected =
                                      String(item.id) === String(value);
                                  return (
                                      <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => {
                                              onChange(String(item.id));
                                              setOpen(false);
                                              setSearch("");
                                          }}
                                          className={`flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                              isSelected
                                                  ? "bg-emerald-50 font-semibold text-emerald-800"
                                                  : "text-neutral-700 hover:bg-neutral-50"
                                          }`}
                                      >
                                          {item.name}
                                      </button>
                                  );
                              })
                            : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

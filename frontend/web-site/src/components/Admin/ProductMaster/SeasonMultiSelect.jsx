import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { seasonService, handleApiError } from "../../../services/api/Admin/seasonService";

export default function SeasonMultiSelect({
    value = [],
    onChange,
    disabled = false,
    placeholder = "Chọn mùa...",
}) {
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    const selectedIds = useMemo(
        () => value.map((id) => String(id)),
        [value],
    );

    useEffect(() => {
        let cancelled = false;

        const fetchSeasons = async () => {
            try {
                setLoading(true);
                setLoadError("");
                const list = await seasonService.getAll();
                if (cancelled) return;

                const activeSeasons = (list ?? [])
                    .filter((item) => item.status !== "inactive")
                    .sort(
                        (a, b) =>
                            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
                            String(a.name ?? "").localeCompare(String(b.name ?? ""), "vi"),
                    );
                setSeasons(activeSeasons);
            } catch (error) {
                if (!cancelled) {
                    setLoadError(handleApiError(error, "Không thể tải danh sách mùa."));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (open || (selectedIds.length > 0 && seasons.length === 0)) {
            fetchSeasons();
        }

        return () => {
            cancelled = true;
        };
    }, [open, selectedIds.length, seasons.length]);

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

    const selectedSeasons = seasons.filter((item) =>
        selectedIds.includes(String(item.id)),
    );

    const displayLabel = useMemo(() => {
        if (selectedSeasons.length === 0) return placeholder;
        if (selectedSeasons.length <= 2) {
            return selectedSeasons.map((item) => item.name).join(", ");
        }
        return `${selectedSeasons.length} mùa đã chọn`;
    }, [placeholder, selectedSeasons]);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return seasons;
        return seasons.filter(
            (item) =>
                item.name?.toLowerCase().includes(keyword) ||
                item.code?.toLowerCase().includes(keyword),
        );
    }, [seasons, search]);

    const toggleSeason = (seasonId) => {
        const idStr = String(seasonId);
        if (selectedIds.includes(idStr)) {
            onChange(selectedIds.filter((id) => id !== idStr));
            return;
        }
        onChange([...selectedIds, idStr]);
    };

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
                        selectedSeasons.length > 0
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
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm mùa..."
                                autoFocus
                                className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto p-1">
                        {loading ? (
                            <p className="px-3 py-2 text-sm text-neutral-500">
                                Đang tải mùa...
                            </p>
                        ) : null}

                        {loadError ? (
                            <p className="px-3 py-2 text-sm text-red-600">
                                {loadError}
                            </p>
                        ) : null}

                        {!loading && !loadError && filtered.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-neutral-500">
                                Không tìm thấy mùa.
                            </p>
                        ) : null}

                        {!loading && !loadError
                            ? filtered.map((item) => {
                                  const isSelected = selectedIds.includes(
                                      String(item.id),
                                  );
                                  return (
                                      <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => toggleSeason(item.id)}
                                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                              isSelected
                                                  ? "bg-emerald-50 font-semibold text-emerald-800"
                                                  : "text-neutral-700 hover:bg-neutral-50"
                                          }`}
                                      >
                                          <span
                                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                  isSelected
                                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                                      : "border-neutral-300 bg-white"
                                              }`}
                                          >
                                              {isSelected ? (
                                                  <Check className="h-3 w-3" />
                                              ) : null}
                                          </span>
                                          <span className="min-w-0 flex-1 truncate">
                                              {item.name}
                                          </span>
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

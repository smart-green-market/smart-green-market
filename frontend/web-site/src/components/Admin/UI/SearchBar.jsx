import { Search, X } from "lucide-react";

/**
 * SearchBar
 * Props:
 *   value       : string
 *   onChange    : (val: string) => void
 *   placeholder : string
 */
export default function SearchBar({
    value,
    onChange,
    placeholder = "Tìm kiếm...",
    className = "",
}) {
    return (
        <div className={`relative w-full min-w-[140px] max-w-[220px] shrink-0 ${className}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-neutral-200 bg-stone-50 py-2 pl-9 pr-8 text-sm text-zinc-800 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300 font-['Geist',sans-serif]"
            />
            {value ? (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </div>
    );
}
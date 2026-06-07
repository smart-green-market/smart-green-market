import { Search, X } from "lucide-react";

/**
 * SearchBar
 * Props:
 *   value       : string
 *   onChange    : (val: string) => void
 *   placeholder : string
 */
export default function SearchBar({ value, onChange, placeholder = "Tìm kiếm..." }) {
    return (
        <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-neutral-200 rounded-lg text-sm text-zinc-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all font-['Geist',sans-serif]"
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
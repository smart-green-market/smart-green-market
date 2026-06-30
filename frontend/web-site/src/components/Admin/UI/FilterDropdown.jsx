import { useId } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterDropdown({
    value,
    onChange,
    options = [],
    label = "Lọc",
    className = "",
}) {
    const selectId = useId();

    return (
        <div className={`relative ${className}`}>
            <label htmlFor={selectId} className="sr-only">
                {label}
            </label>
            <select
                id={selectId}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-w-[150px] shrink-0 cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-stone-50 py-2 pl-3 pr-9 text-sm text-zinc-800 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300 font-['Geist',sans-serif]"
            >
                {options.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
    );
}

import { Filter } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import SearchBar from "../../common/SearchBar";

export default function SupplierFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  filterOptions,
  placeholder = "Tìm kiếm nhà cung cấp..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const options = filterOptions;

  // Find label of active option for display if needed
  const activeOption = options.find((opt) => opt.value === statusFilter);

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative w-full sm:w-80">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={placeholder}
        />
      </div>

      {onStatusChange && (
        <div className="relative flex items-center gap-2 self-end sm:self-auto" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="h-10 px-3.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Filter className="w-3.5 h-3.5" /> Bộ lọc
            {statusFilter !== undefined && statusFilter !== "" && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
                {activeOption ? activeOption.label : statusFilter}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onStatusChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-neutral-50 flex items-center justify-between cursor-pointer ${
                    statusFilter === option.value
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-neutral-600"
                  }`}
                >
                  <span className={option.colorClass || "text-neutral-700"}>
                    {option.label}
                  </span>
                  {statusFilter === option.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


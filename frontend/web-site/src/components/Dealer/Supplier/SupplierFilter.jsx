import { Filter } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import SearchBar from "../../common/SearchBar";

export default function SupplierFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  filterOptions,
  placeholder = "Tìm kiếm nhà cung cấp..."
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Tự động đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative w-full sm:w-80">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={placeholder}
        />
      </div>

      <div className="relative flex items-center gap-2 self-end sm:self-auto" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="h-10 px-3.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Filter className="w-3.5 h-3.5" /> Bộ lọc
          {statusFilter && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
              {statusFilter}
            </span>
          )}
        </button>

        {/* Menu thả xuống chọn trạng thái lọc */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-100 rounded-xl shadow-lg z-50 p-2 text-xs flex flex-col gap-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  setShowDropdown(false);
                }}
                className={`text-left px-3 py-2 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === option.value ? "bg-emerald-50 font-semibold" : ""
                } ${option.colorClass}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { Search, ChevronDown } from "lucide-react";

export default function FiltersBar({
  suppliers = [],
  categories = [],
  selectedSupplier,
  setSelectedSupplier,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Supplier select */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
          Nhà cung cấp
        </label>
        <div className="relative">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full h-11 pl-4 pr-10 border border-neutral-200 rounded-xl text-sm font-medium bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-emerald-600 outline-none appearance-none transition-all cursor-pointer"
          >
            <option value="">Tất cả</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Category select */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
          Danh mục sản phẩm
        </label>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-11 pl-4 pr-10 border border-neutral-200 rounded-xl text-sm font-medium bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-emerald-600 outline-none appearance-none transition-all cursor-pointer"
          >
            <option value="">Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Quick search input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
          Tìm kiếm nhanh
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Tên sản phẩm, mã hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-emerald-600 outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        </div>
      </div>
    </div>
  );
}

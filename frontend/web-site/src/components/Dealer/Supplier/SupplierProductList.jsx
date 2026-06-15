import { useState } from "react";
import { Search, Package } from "lucide-react";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80&fit=crop";

const formatVND = (price) => {
  if (price == null) return "0 ₫";
  if (typeof price === "string") {
    if (price.includes("đ") || price.includes("₫") || price === "Liên hệ") {
      return price;
    }
    const num = parseFloat(price.replace(/[^\d.-]/g, ""));
    if (isNaN(num)) return "0 ₫";
    return num.toLocaleString("vi-VN") + " ₫";
  }
  return price.toLocaleString("vi-VN") + " ₫";
};

export default function SupplierProductList({ products = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filters supplier products
  const filteredProducts = (products ?? []).filter((prod) => {
    if (!prod) return false;
    const name = prod.name ?? "";
    const code = prod.code ?? "";
    const category = prod.category ?? "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "" || prod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === "Đang kinh doanh") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Đang kinh doanh
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-50 text-neutral-500 border border-neutral-200">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        Tạm ngưng
      </span>
    );
  };

  return (
    <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm font-['Geist',sans-serif]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-extrabold text-emerald-950">
            Danh sách sản phẩm cung cấp
          </h2>
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200/60">
            {filteredProducts.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 border border-neutral-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium transition-all duration-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold text-neutral-600 cursor-pointer bg-white transition-all duration-200"
          >
            <option value="">Trạng thái (Tất cả)</option>
            <option value="Đang kinh doanh">Đang kinh doanh</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl border border-neutral-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:border-emerald-200"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden">
                <img
                  src={prod.image || PLACEHOLDER_IMAGE}
                  alt={prod.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                  className="w-full h-40 object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
                />

                {/* Category Badge */}
                {prod.category && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600/90 text-white backdrop-blur-sm shadow-sm">
                    {prod.category}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 space-y-2">
                {/* Product Name */}
                <h3 className="text-xs font-bold text-neutral-800 line-clamp-1 group-hover:text-emerald-900 transition-colors duration-200">
                  {prod.name}
                </h3>

                {/* Unit */}
                {prod.unit && (
                  <p className="text-[10px] font-medium text-neutral-400">
                    Đơn vị: {prod.unit}
                  </p>
                )}

                {/* Price & Status Row */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-50">
                  <span className="text-sm font-extrabold text-emerald-700">
                    {formatVND(prod.price)}
                  </span>
                  {getStatusBadge(prod.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-neutral-300" />
          </div>
          <p className="text-sm font-bold text-neutral-400 mb-1">
            Không tìm thấy sản phẩm
          </p>
          <p className="text-xs text-neutral-300 font-medium text-center max-w-[240px]">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái để xem thêm sản phẩm.
          </p>
        </div>
      )}
    </div>
  );
}

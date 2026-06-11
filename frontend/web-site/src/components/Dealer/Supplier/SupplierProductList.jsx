import { useState } from "react";
import { Search } from "lucide-react";

export default function SupplierProductList({ products }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filters supplier products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || prod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === "Đang kinh doanh") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
          Đang kinh doanh
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-50 text-neutral-500 border border-neutral-200">
        Tạm ngưng
      </span>
    );
  };

  return (
    <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm font-['Geist',sans-serif]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-sm font-extrabold text-emerald-950">
          Danh sách sản phẩm cung cấp
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 border border-neutral-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold text-neutral-600 cursor-pointer bg-white"
          >
            <option value="">Trạng thái (Tất cả)</option>
            <option value="Đang kinh doanh">Đang kinh doanh</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 border-b border-neutral-100">
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Mã sản phẩm</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Hình ảnh</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tên sản phẩm</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Danh mục</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Đơn vị tính</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Giá bán sỉ</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod, index) => (
                <tr
                  key={index}
                  className="hover:bg-neutral-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5 text-xs font-bold text-neutral-500 group-hover:text-emerald-700 transition-colors font-mono">
                    {prod.code}
                  </td>
                  <td className="px-4 py-3.5">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg border border-neutral-150 object-cover shadow-sm group-hover:scale-105 transition-transform"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-neutral-800 group-hover:text-emerald-950 transition-colors">
                    {prod.name}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-neutral-500">
                    {prod.category}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-neutral-600 text-center">
                    {prod.unit}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-extrabold text-emerald-800 text-right">
                    {prod.price}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {getStatusBadge(prod.status)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-xs font-bold text-neutral-400">
                  Không tìm thấy sản phẩm nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

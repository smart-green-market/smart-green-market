import React from 'react';
import { Search } from 'lucide-react';

const DiscountFilterBar = ({ 
  search, 
  setSearch, 
  scope, 
  setScope, 
  status, 
  setStatus, 
  setPage 
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm chính sách..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      <div className="flex w-full md:w-auto gap-4">
        <select 
          value={scope} 
          onChange={(e) => { setScope(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="all">Tất cả phạm vi</option>
          <option value="all_products">Tất cả sản phẩm</option>
          <option value="category">Theo danh mục</option>
          <option value="dealer_product">Sản phẩm cụ thể</option>
        </select>

        <select 
          value={status} 
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã tắt</option>
        </select>
      </div>
    </div>
  );
};

export default DiscountFilterBar;

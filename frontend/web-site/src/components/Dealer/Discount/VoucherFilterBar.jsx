import React from 'react';
import { Search } from 'lucide-react';

const VoucherFilterBar = ({ 
  search, 
  setSearch, 
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
          placeholder="Tìm kiếm voucher theo mã hoặc tiêu đề..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      <div className="flex w-full md:w-auto gap-4">
        <select 
          value={status} 
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="pending">Chờ duyệt</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
          <option value="expired">Hết hạn</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>
    </div>
  );
};

export default VoucherFilterBar;

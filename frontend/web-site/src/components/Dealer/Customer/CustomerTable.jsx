import { Loader2, AlertTriangle, Users, MoreHorizontal } from "lucide-react";

export default function CustomerTable({
  loading,
  error,
  customers,
  pagination,
  onPageChange,
  onRetry,
  searchQuery,
  statusFilter,
}) {
  /** Lấy chữ cái đầu của tên để hiển thị avatar */
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /** Format tiền tệ VND */
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M đ`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K đ`;
    return `${num.toLocaleString("vi-VN")} đ`;
  };

  /** Format ngày giờ */
  const formatDate = (dateStr) => {
    if (!dateStr) return "Chưa có";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /** Xác định badge trạng thái */
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return { label: "Hoạt động", className: "bg-emerald-100/60 text-emerald-700 border-emerald-200/50" };
      case "inactive":
        return { label: "Ngừng hoạt động", className: "bg-neutral-100 text-neutral-600 border-neutral-200/50" };
      case "banned":
        return { label: "Bị khóa", className: "bg-red-100/60 text-red-700 border-red-200/50" };
      default:
        return { label: status || "N/A", className: "bg-neutral-100 text-neutral-600 border-neutral-200/50" };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
      
      {/* Table Header */}
      <div className="p-5 flex justify-between items-center border-b border-neutral-100 bg-neutral-50/50">
        <h3 className="text-base font-black text-neutral-900 tracking-tight">
          Danh sách chi tiết ({customers.length})
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-sm text-neutral-500 font-medium">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && customers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="w-10 h-10 text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-500 font-medium">
            {searchQuery || statusFilter
              ? "Không tìm thấy khách hàng phù hợp."
              : "Chưa có khách hàng nào."}
          </p>
        </div>
      )}

      {/* Table Content */}
      {!loading && !error && customers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider w-[30%]">Tên khách hàng</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Tổng chi tiêu</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Ngày đăng ký</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.map((customer) => {
                const badge = getStatusBadge(customer.status);
                return (
                  <tr key={customer.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        {customer.account?.avatar_url ? (
                          <img
                            src={customer.account.avatar_url}
                            alt={customer.full_name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-200/70 flex items-center justify-center text-neutral-600 font-bold text-sm shrink-0">
                            {getInitials(customer.full_name)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-neutral-900 text-sm leading-tight">{customer.full_name}</p>
                          <p className="text-[12px] font-medium text-neutral-500 mt-0.5">{customer.dealer_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-neutral-600">{customer.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-neutral-600">{customer.phone}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-neutral-900">
                          {formatCurrency(customer.total_spent)}
                        </span>
                        {customer.total_orders > 0 && (
                          <span className="text-[11px] font-bold text-neutral-400">
                            ({customer.total_orders} đơn)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-neutral-500">
                        {formatDate(customer.created_at)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination && pagination.count > pagination.pageSize && (
        <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-sm text-neutral-500 font-medium">
            Trang {pagination.page} · Hiển thị {customers.length} / {pagination.count} khách hàng
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 text-sm font-bold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Trang trước
            </button>
            <button
              disabled={!pagination.hasMore}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 text-sm font-bold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

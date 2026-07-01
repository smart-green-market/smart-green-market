import React from 'react';
import SortableHeader from "../../common/SortableHeader";
import Pagination from "../../common/Pagination";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
  code: { key: "code", type: "string" },
  title: { key: "title", type: "string" },
  discount_value: { key: "discount_value", type: "number" },
  min_order_amount: { key: "min_order_amount", type: "number" },
  status: { key: "status", type: "string" }
};

export default function VoucherTable({
  vouchers = [],
  totalCount = 0,
  page = 1,
  setPage,
  limit = 10,
  handleDelete,
  setSelectedVoucherId,
  setIsDetailModalOpen,
  setIsEditModalOpen,
}) {
  const totalPages = Math.ceil(totalCount / limit);
  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(vouchers, COLUMN_CONFIG);

  const formatMoney = (value) => {
    if (value === undefined || value === null) return "0đ";
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status, rejectReason) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            Đang hoạt động
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Chờ duyệt
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            Nháp
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            Tạm dừng
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
            Hết hạn
          </span>
        );
      case "rejected":
        return (
          <div className="group relative inline-block cursor-help">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              Bị từ chối
            </span>
            {rejectReason && (
              <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-lg">
                Lý do: {rejectReason}
                <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                  <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                </svg>
              </div>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 font-['Geist',sans-serif]">
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader column="code" label="Mã Voucher" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader column="title" label="Tiêu đề" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Mức giảm
                </th>
                <SortableHeader column="min_order_amount" label="Đơn tối thiểu" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Giới hạn sử dụng
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Thời gian
                </th>
                <SortableHeader column="status" label="Trạng thái" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    Không tìm thấy voucher nào.
                  </td>
                </tr>
              ) : (
                sortedData.map((voucher) => (
                  <tr key={voucher.id || Math.random()} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-green-50 text-green-700 font-mono text-sm font-bold border border-green-200">
                        {voucher.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={voucher.title}>
                        {voucher.title}
                      </div>
                      {voucher.description && (
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title={voucher.description}>
                          {voucher.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">
                        {voucher.discount_type === 'percent' 
                          ? `${Number(voucher.discount_value)}%` 
                          : formatMoney(Number(voucher.discount_value))
                        }
                      </div>
                      {voucher.discount_type === 'percent' && voucher.max_discount_amount && (
                        <div className="text-[10px] text-gray-500">
                          Tối đa: {formatMoney(Number(voucher.max_discount_amount))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatMoney(Number(voucher.min_order_amount))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.usage_limit ? `${voucher.usage_limit} lượt` : "Không giới hạn"}
                      </div>
                      {voucher.usage_limit_per_customer && (
                        <div className="text-[10px] text-gray-500">
                          Tối đa {voucher.usage_limit_per_customer} lượt/khách
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-950">
                        Bắt đầu: {formatDate(voucher.start_date)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Kết thúc: {formatDate(voucher.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(voucher.status, voucher.reject_reason)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-4 text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedVoucherId(voucher.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVoucherId(voucher.id);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}


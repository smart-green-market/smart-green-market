import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { voucherService } from '../../../services/api/voucherService';
import { toast } from 'sonner';

export default function VoucherDetailModal({ isOpen, onClose, voucherId }) {
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && voucherId) {
      fetchVoucherDetail();
    } else {
      setVoucher(null);
    }
  }, [isOpen, voucherId]);

  const fetchVoucherDetail = async () => {
    try {
      setIsLoading(true);
      const data = await voucherService.getById(voucherId);
      setVoucher(data);
    } catch (error) {
      console.error('Error fetching voucher detail:', error);
      toast.error('Không thể tải thông tin chi tiết voucher. Vui lòng thử lại sau.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (value) => {
    if (value === undefined || value === null) return "0đ";
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    return String(timeStr).slice(0, 5);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Đang hoạt động
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Chờ duyệt
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            Nháp
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            Tạm dừng
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Hết hạn
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            Bị từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Chi tiết Voucher</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : voucher ? (
            <div className="space-y-6 font-['Geist',sans-serif]">
              {/* Title & Code */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 font-mono font-bold text-sm bg-green-50 text-green-700 border border-green-200 rounded">
                    {voucher.code}
                  </span>
                  {getStatusBadge(voucher.status)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{voucher.title}</h3>
                {voucher.description && (
                  <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    "{voucher.description}"
                  </p>
                )}
              </div>

              {/* Status Reason Alert */}
              {voucher.status === 'rejected' && voucher.reject_reason && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Lý do bị từ chối duyệt:</span>
                    {voucher.reject_reason}
                  </div>
                </div>
              )}

              {/* Value details */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-xs border-b pb-1.5 mb-2">Thông tin giảm giá</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Hình thức giảm giá:</span>
                  <span className="font-medium text-gray-900">
                    {voucher.discount_type === 'percent' ? 'Theo phần trăm (%)' : 'Số tiền cố định (đ)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Mức giảm:</span>
                  <span className="font-bold text-green-600">
                    {voucher.discount_type === 'percent' 
                      ? `${Number(voucher.discount_value)}%` 
                      : formatMoney(Number(voucher.discount_value))}
                  </span>
                </div>
                {voucher.discount_type === 'percent' && voucher.max_discount_amount && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Giảm tối đa:</span>
                    <span className="font-medium text-gray-900">{formatMoney(Number(voucher.max_discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Giá trị đơn tối thiểu:</span>
                  <span className="font-medium text-gray-900">{formatMoney(Number(voucher.min_order_amount))}</span>
                </div>
              </div>

              {/* Usage details */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-xs border-b pb-1.5 mb-2">Giới hạn sử dụng</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tổng lượt dùng tối đa:</span>
                  <span className="font-medium text-gray-900">
                    {voucher.usage_limit ? `${voucher.usage_limit} lượt` : 'Không giới hạn'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Mỗi khách hàng sử dụng tối đa:</span>
                  <span className="font-medium text-gray-900">
                    {voucher.usage_limit_per_customer ? `${voucher.usage_limit_per_customer} lượt` : 'Không giới hạn'}
                  </span>
                </div>
              </div>

              {/* Audience details */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-xs border-b pb-1.5 mb-2">Đối tượng áp dụng</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Loại đối tượng:</span>
                  <span className="font-semibold text-gray-900">
                    {voucher.audience_type === 'LOYALTY_TIER' 
                      ? 'Hạng thành viên B2C' 
                      : voucher.audience_type === 'CUSTOMER_SEGMENT' 
                      ? 'Phân khúc khách hàng' 
                      : 'Tất cả khách hàng'}
                  </span>
                </div>
                {voucher.audience_type === 'LOYALTY_TIER' && voucher.loyalty_tiers && voucher.loyalty_tiers.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-500">Các hạng áp dụng:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {voucher.loyalty_tiers.map(tier => (
                        <span key={tier.id} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs font-bold">
                          {tier.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {voucher.audience_type === 'CUSTOMER_SEGMENT' && voucher.customer_segments && voucher.customer_segments.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-500">Các phân khúc áp dụng:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {voucher.customer_segments.map(seg => (
                        <span key={seg.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-bold">
                          {seg.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Time Details */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-xs border-b pb-1.5 mb-2">Thời gian hoạt động</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Kiểu áp dụng:</span>
                  <span className={`font-semibold px-2.5 py-1 rounded-full text-xs ${
                    voucher.schedule_type === 'daily_time'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {voucher.schedule_type === 'daily_time' ? 'Flash sale hằng ngày' : 'Theo khoảng ngày'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {voucher.schedule_type === 'daily_time' ? 'Ngày bắt đầu chiến dịch:' : 'Ngày bắt đầu:'}
                  </span>
                  <span className="font-medium text-gray-900">{formatDate(voucher.start_date)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {voucher.schedule_type === 'daily_time' ? 'Ngày kết thúc chiến dịch:' : 'Ngày kết thúc:'}
                  </span>
                  <span className="font-medium text-gray-900">{formatDate(voucher.end_date)}</span>
                </div>
                {voucher.schedule_type === 'daily_time' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Khung giờ mỗi ngày:</span>
                    <span className="font-semibold text-orange-700">
                      {formatTime(voucher.daily_start_time)} → {formatTime(voucher.daily_end_time)}
                    </span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không tìm thấy thông tin voucher.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

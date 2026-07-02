import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Tag, AlertCircle, Percent, DollarSign } from 'lucide-react';
import { discountService } from '../../../services/api/discountService';
import { formatDateTime } from '../../common/formatDateTime';
import { toast } from 'sonner';

export default function DiscountDetailModal({ isOpen, onClose, policyId }) {
  const [policy, setPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && policyId) {
      fetchPolicyDetail();
    } else {
      setPolicy(null);
    }
  }, [isOpen, policyId]);

  const fetchPolicyDetail = async () => {
    try {
      setIsLoading(true);
      const data = await discountService.getById(policyId);
      setPolicy(data);
    } catch (error) {
      console.error('Error fetching policy detail:', error);
      toast.error('Không thể tải thông tin chi tiết. Vui lòng thử lại sau.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDiscount = (p) => {
    if (!p) return '';
    if (p.discount_type === 'percent') {
      return `${parseFloat(p.discount_value || 0)}%`;
    }
    return `${parseFloat(p.discount_value || 0).toLocaleString('vi-VN')}đ`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
        style={{ animation: 'fadeInScale 0.25s ease-out' }}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Tag size={20} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Chi tiết chính sách giảm giá</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : policy ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{policy.title}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${policy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {policy.is_active ? '✅ Đang hoạt động' : '⏸️ Tạm ngưng'}
                  </span>
                  <span className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <Tag size={14} className="mr-1.5" />
                    {policy.scope === 'all' ? 'Tất cả sản phẩm' :
                     policy.scope === 'category' ? 'Theo danh mục' :
                     policy.scope === 'dealer_product' ? 'Sản phẩm cụ thể' : 'Tất cả'}
                  </span>
                  <span className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <AlertCircle size={14} className="mr-1.5" />
                    Ưu tiên: {policy.priority}
                  </span>
                </div>
              </div>

              {/* Discount Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  {policy.discount_type === 'percent' ? <Percent size={16} className="text-green-600" /> : <DollarSign size={16} className="text-green-600" />}
                  Mức giảm giá
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-green-700">{formatDiscount(policy)}</span>
                  <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    {policy.discount_type === 'percent' ? 'Giảm theo phần trăm' : 'Giảm số tiền cố định'}
                  </span>
                </div>
              </div>

              {/* Time Info */}
              {(policy.start_at || policy.end_at) && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center text-blue-800">
                    <Calendar size={18} className="mr-2" />
                    <span className="font-medium text-sm">Thời gian áp dụng:</span>
                  </div>
                  <div className="flex-1 text-sm text-gray-700">
                    {policy.start_at ? formatDateTime(policy.start_at) : 'Không xác định'} 
                    {' → '}
                    {policy.end_at ? formatDateTime(policy.end_at) : 'Không giới hạn'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không tìm thấy thông tin chính sách.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

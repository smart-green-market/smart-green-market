import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Tag, AlertCircle, TrendingDown } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Chi tiết chính sách giảm giá</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{policy.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${policy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {policy.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </span>
                  <span className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <Tag size={14} className="mr-1.5" />
                    {policy.scope === 'all' ? 'Tất cả sản phẩm' :
                     policy.scope === 'category' ? 'Theo danh mục' :
                     policy.scope === 'dealer_product' ? 'Sản phẩm cụ thể' : 'Tất cả'}
                  </span>
                  <span className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <AlertCircle size={14} className="mr-1.5" />
                    Ưu tiên: {policy.priority}
                  </span>
                </div>
              </div>

              {/* Time Info */}
              {(policy.start_at || policy.end_at) && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center text-blue-800">
                    <Calendar size={18} className="mr-2" />
                    <span className="font-medium">Thời gian áp dụng:</span>
                  </div>
                  <div className="flex-1 text-sm text-gray-700">
                    {policy.start_at ? formatDateTime(policy.start_at) : 'Không xác định'} 
                    {' - '}
                    {policy.end_at ? formatDateTime(policy.end_at) : 'Không giới hạn'}
                  </div>
                </div>
              )}

              {/* Rules / Tiers */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <TrendingDown className="mr-2 text-green-600" size={20} />
                  Các mức giảm giá
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Điều kiện áp dụng: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {policy.threshold_type === 'remaining_days' ? 'Số ngày còn lại' :
                       policy.threshold_type === 'used_shelf_life_percent' ? '% Hạn sử dụng đã qua' :
                       policy.threshold_type === 'age_days' ? 'Số ngày tồn kho' : policy.threshold_type}
                    </span>
                  </div>
                  
                  {policy.tiers && policy.tiers.length > 0 ? (
                    <div className="space-y-3">
                      {policy.tiers.sort((a, b) => a.sort_order - b.sort_order).map((tier) => (
                        <div key={tier.id} className="flex flex-wrap justify-between items-center bg-white p-3 rounded border border-gray-100 shadow-sm">
                          <div className="text-sm text-gray-700 font-medium flex items-center">
                            Nếu giá trị <span className="text-blue-600 mx-1">{tier.operator === 'gte' ? '>=' : tier.operator === 'lte' ? '<=' : tier.operator === 'gt' ? '>' : '<'}</span> {tier.threshold_value}
                          </div>
                          <div className="text-sm font-bold text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-md">
                            Giảm {tier.discount_value}{tier.discount_type === 'percent' ? '%' : 'đ'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Chưa có mức giảm giá nào được thiết lập.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không tìm thấy thông tin chính sách.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
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

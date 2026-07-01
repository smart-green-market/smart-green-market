import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { voucherService } from '../../../services/api/voucherService';
import { toast } from 'sonner';

export default function EditVoucherModal({ isOpen, onClose, onSuccess, voucherId }) {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: 0,
    max_discount_amount: '',
    usage_limit: '',
    usage_limit_per_customer: '',
    start_date: '',
    end_date: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalStartDate, setOriginalStartDate] = useState('');

  useEffect(() => {
    if (isOpen && voucherId) {
      fetchVoucherDetail();
    }
  }, [isOpen, voucherId]);

  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const getMinStartDate = () => {
    const nowStr = getMinDateTime();
    if (!originalStartDate) return nowStr;
    const origLocal = formatDateTimeLocal(originalStartDate);
    return origLocal < nowStr ? origLocal : nowStr;
  };

  const fetchVoucherDetail = async () => {
    try {
      setIsLoading(true);
      const data = await voucherService.getById(voucherId);
      setOriginalStartDate(data.start_date || '');
      setFormData({
        title: data.title || '',
        code: data.code || '',
        description: data.description || '',
        discount_type: data.discount_type || 'percent',
        discount_value: data.discount_value || '',
        min_order_amount: data.min_order_amount || 0,
        max_discount_amount: data.max_discount_amount || '',
        usage_limit: data.usage_limit || '',
        usage_limit_per_customer: data.usage_limit_per_customer || '',
        start_date: formatDateTimeLocal(data.start_date),
        end_date: formatDateTimeLocal(data.end_date),
      });
    } catch (error) {
      console.error('Error fetching voucher detail for edit:', error);
      toast.error('Không thể tải thông tin voucher. Vui lòng thử lại sau.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    if (Number(formData.discount_value) <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0');
      return;
    }

    if (formData.discount_type === 'percent' && Number(formData.discount_value) > 100) {
      toast.error('Phần trăm giảm giá không thể vượt quá 100%');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        title: formData.title,
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      payload.max_discount_amount = formData.discount_type === 'percent' && formData.max_discount_amount
        ? Number(formData.max_discount_amount)
        : null;

      payload.usage_limit = formData.usage_limit ? parseInt(formData.usage_limit, 10) : null;
      payload.usage_limit_per_customer = formData.usage_limit_per_customer ? parseInt(formData.usage_limit_per_customer, 10) : null;

      await voucherService.update(voucherId, payload);
      toast.success('Cập nhật voucher thành công');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating voucher:', error);
      const errors = error.response?.data;
      if (errors && typeof errors === 'object') {
        const errorMsg = Object.entries(errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(errorMsg || 'Lỗi khi cập nhật voucher');
      } else {
        toast.error('Lỗi khi cập nhật voucher. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa Voucher</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden font-['Geist',sans-serif]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* General Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin chung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề chương trình</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="VD: Chương trình khuyến mãi Hè 2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher (Code)</label>
                    <input
                      type="text"
                      name="code"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono bg-gray-50 cursor-not-allowed"
                      disabled
                      placeholder="VD: KHUYENMAI50K"
                    />
                    <p className="text-xs text-gray-500 mt-1">Không thể thay đổi mã voucher sau khi đã tạo.</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                    <textarea
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Mô tả điều kiện áp dụng hoặc quyền lợi..."
                    />
                  </div>
                </div>
              </div>

              {/* Discount Rules */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thiết lập giảm giá</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                    <select
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="percent">Theo phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm giá</label>
                    <input
                      type="number"
                      name="discount_value"
                      required
                      min={0.01}
                      step="any"
                      value={formData.discount_value}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={formData.discount_type === 'percent' ? "VD: 10" : "VD: 20000"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn hàng tối thiểu (đ)</label>
                    <input
                      type="number"
                      name="min_order_amount"
                      min={0}
                      step="any"
                      value={formData.min_order_amount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="VD: 50000"
                    />
                  </div>

                  {formData.discount_type === 'percent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mức giảm tối đa (đ)</label>
                      <input
                        type="number"
                        name="max_discount_amount"
                        min={0}
                        step="any"
                        value={formData.max_discount_amount || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Không bắt buộc (VD: 30000)"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Limits */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Giới hạn sử dụng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tổng lượt dùng tối đa</label>
                    <input
                      type="number"
                      name="usage_limit"
                      min={1}
                      value={formData.usage_limit || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lượt dùng tối đa mỗi khách hàng</label>
                    <input
                      type="number"
                      name="usage_limit_per_customer"
                      min={1}
                      value={formData.usage_limit_per_customer || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </div>
                </div>
              </div>

              {/* Time Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thời gian hiệu lực</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      required
                      min={getMinStartDate()}
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      required
                      min={formData.start_date || getMinDateTime()}
                      value={formData.end_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { voucherService } from '../../../services/api/voucherService';
import { dealerProductService } from '../../../services/api/dealerProductService';
import { categoryService } from '../../../services/api/categoryService';
import { customerService } from '../../../services/api/customerService';
import { toast } from 'sonner';

export default function CreateVoucherModal({ isOpen, onClose, onSuccess }) {
  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

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
    start_date: getMinDateTime(),
    end_date: getMinDateTime(),
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [targetType, setTargetType] = useState('all');
  const [targetId, setTargetId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: '',
        min_order_amount: 0,
        max_discount_amount: '',
        usage_limit: '',
        usage_limit_per_customer: '',
        start_date: getMinDateTime(),
        end_date: getMinDateTime(),
      });
      setTargetType('all');
      setTargetId('');
      fetchTargetsData();
    }
  }, [isOpen]);

  const fetchTargetsData = async () => {
    try {
      const [catsData, prodsData, custsData] = await Promise.all([
        categoryService.getAll({ limit: 100, status: 'active' }).catch(() => []),
        dealerProductService.getAll({ limit: 100 }).catch(() => []),
        customerService.getAll({ limit: 100 }).catch(() => []),
      ]);
      setCategories(Array.isArray(catsData) ? catsData : catsData?.results || []);
      setProducts(Array.isArray(prodsData) ? prodsData : prodsData?.results || []);
      setCustomers(Array.isArray(custsData) ? custsData : custsData?.results || []);
    } catch (error) {
      console.error('Error fetching targets data:', error);
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

    if (targetType !== 'all' && !targetId) {
      toast.error('Vui lòng chọn đối tượng áp dụng cụ thể');
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

      if (formData.discount_type === 'percent' && formData.max_discount_amount) {
        payload.max_discount_amount = Number(formData.max_discount_amount);
      }
      if (formData.usage_limit) {
        payload.usage_limit = parseInt(formData.usage_limit, 10);
      }
      if (formData.usage_limit_per_customer) {
        payload.usage_limit_per_customer = parseInt(formData.usage_limit_per_customer, 10);
      }

      // Add targets payload
      const targetObj = { target_type: targetType };
      if (targetType === 'category' && targetId) {
        targetObj.category = parseInt(targetId, 10);
      } else if (targetType === 'product' && targetId) {
        targetObj.dealer_product = parseInt(targetId, 10);
      } else if (targetType === 'customer' && targetId) {
        targetObj.customer = parseInt(targetId, 10);
      }
      payload.targets = [targetObj];

      await voucherService.create(payload);
      toast.success('Tạo voucher thành công');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating voucher:', error);
      const errors = error.response?.data;
      if (errors && typeof errors === 'object') {
        const errorMsg = Object.entries(errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(errorMsg || 'Lỗi khi tạo voucher');
      } else {
        toast.error('Lỗi khi tạo voucher. Vui lòng thử lại.');
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
          <h2 className="text-xl font-bold text-gray-800">Tạo Voucher mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    placeholder="VD: KHUYENMAI50K"
                  />
                  <p className="text-xs text-gray-500 mt-1">Chỉ chứa chữ hoa không dấu, số, dấu gạch ngang (-), gạch dưới (_).</p>
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

            {/* Đối tượng áp dụng (Targets) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Đối tượng áp dụng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại đối tượng</label>
                  <select
                    value={targetType}
                    onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="all">Tất cả khách hàng & sản phẩm</option>
                    <option value="product">Theo sản phẩm cụ thể</option>
                    <option value="category">Theo danh mục sản phẩm</option>
                    <option value="customer">Theo khách hàng cụ thể</option>
                  </select>
                </div>

                {targetType === 'product' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.title || prod.supplier_product_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn danh mục</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'customer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn khách hàng</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map(cust => (
                        <option key={cust.id} value={cust.id}>
                          {cust.full_name} {cust.phone ? `(${cust.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                    placeholder={formData.discount_type === 'percent' ? "VD: 10 (tức là 10%)" : "VD: 20000 (tức là 20.000đ)"}
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
                      value={formData.max_discount_amount}
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
                    value={formData.usage_limit}
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
                    value={formData.usage_limit_per_customer}
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
                    min={getMinDateTime()}
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
              Tạo Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

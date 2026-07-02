import React, { useState, useEffect } from 'react';
import { X, Percent, DollarSign, Tag, Calendar, Zap } from 'lucide-react';
import { dealerProductService } from '../../../services/api/dealerProductService';
import { categoryService } from '../../../services/api/categoryService';
import { discountService } from '../../../services/api/discountService';
import { toast } from 'sonner';

export default function CreateDiscountModal({ isOpen, onClose, onSuccess }) {
  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const initialFormData = {
    title: '',
    scope: 'all',
    category: '',
    dealer_product: '',
    discount_type: 'percent',
    discount_value: '',
    priority: 0,
    is_active: true,
    start_at: getMinDateTime(),
    end_at: getMinDateTime(),
  };

  const [formData, setFormData] = useState(initialFormData);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchProducts();
      setFormData({ ...initialFormData, start_at: getMinDateTime(), end_at: getMinDateTime() });
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll({ limit: 100, status: 'active' });
      setCategories(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await dealerProductService.getAll({ limit: 100 });
      setProducts(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error('Error fetching products:', error);
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

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast.error('Vui lòng nhập mức giảm giá hợp lệ');
      return;
    }

    if (formData.discount_type === 'percent' && parseFloat(formData.discount_value) > 100) {
      toast.error('Phần trăm giảm giá không được vượt quá 100%');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title,
        scope: formData.scope,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        priority: parseInt(formData.priority) || 0,
        is_active: formData.is_active,
        start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
      };

      // Only include category/dealer_product based on scope
      if (formData.scope === 'category' && formData.category) {
        payload.category = parseInt(formData.category);
      }

      if (formData.scope === 'dealer_product' && formData.dealer_product) {
        payload.dealer_product = parseInt(formData.dealer_product);
      }

      await discountService.create(payload);
      toast.success('Tạo chính sách giảm giá thành công');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating discount policy:', error);
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        const messages = Object.entries(errData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(messages || 'Lỗi khi tạo chính sách');
      } else {
        toast.error(errData?.detail || 'Lỗi khi tạo chính sách');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ animation: 'fadeInScale 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Tag size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Tạo chính sách giảm giá</h2>
              <p className="text-xs text-gray-500">Thiết lập chương trình giảm giá mới cho sản phẩm</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tên chính sách */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên chính sách giảm giá <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                placeholder="VD: Giảm giá mùa hè, Flash sale cuối tuần..."
              />
            </div>

            {/* Phạm vi & Đối tượng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phạm vi áp dụng</label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-white"
                >
                  <option value="all">🏷️ Tất cả sản phẩm</option>
                  <option value="category">📂 Theo danh mục</option>
                  <option value="dealer_product">📦 Sản phẩm cụ thể</option>
                </select>
              </div>

              {formData.scope === 'category' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chọn danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-white"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.scope === 'dealer_product' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chọn sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="dealer_product"
                    value={formData.dealer_product}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-white"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.title || prod.supplier_product_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Mức giảm giá */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Percent size={16} className="text-green-600" />
                Cấu hình mức giảm giá
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm giá</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discount_type: 'percent' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        formData.discount_type === 'percent'
                          ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <Percent size={16} />
                      Phần trăm
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discount_type: 'fixed' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        formData.discount_type === 'fixed'
                          ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <DollarSign size={16} />
                      Số tiền cố định
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discount_value"
                      required
                      min="0"
                      max={formData.discount_type === 'percent' ? '100' : undefined}
                      step="0.01"
                      value={formData.discount_value}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      placeholder={formData.discount_type === 'percent' ? 'VD: 15' : 'VD: 50000'}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      {formData.discount_type === 'percent' ? '%' : 'đ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thời gian & Ưu tiên */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Thời gian áp dụng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    name="start_at"
                    value={formData.start_at}
                    min={getMinDateTime()}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kết thúc</label>
                  <input
                    type="datetime-local"
                    name="end_at"
                    value={formData.end_at}
                    min={formData.start_at || getMinDateTime()}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Độ ưu tiên */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Độ ưu tiên
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-32 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm text-center"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 italic">Số càng nhỏ thì ưu tiên càng cao</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 rounded-b-2xl">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">Kích hoạt ngay</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 shadow-md shadow-green-200 hover:shadow-lg hover:shadow-green-200 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Tạo chính sách'
                )}
              </button>
            </div>
          </div>
        </form>
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

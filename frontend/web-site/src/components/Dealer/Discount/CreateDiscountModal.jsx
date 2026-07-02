import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { dealerProductService } from '../../../services/api/dealerProductService';
import { categoryService } from '../../../services/api/categoryService';
import { discountService } from '../../../services/api/discountService';
import { toast } from 'sonner';

export default function CreateDiscountModal({ isOpen, onClose, onSuccess }) {
  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: '',
    scope: 'all',
    category: '',
    dealer_product: '',
    threshold_type: 'remaining_days',
    priority: 0,
    is_active: true,
    start_at: getMinDateTime(),
    end_at: getMinDateTime(),
    tiers: [
      {
        operator: 'lte',
        threshold_value: '',
        discount_type: 'percent',
        discount_value: '',
        sort_order: 0,
      }
    ]
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchProducts();
      setFormData({
        title: '',
        scope: 'all',
        category: '',
        dealer_product: '',
        threshold_type: 'remaining_days',
        priority: 0,
        is_active: true,
        start_at: getMinDateTime(),
        end_at: getMinDateTime(),
        tiers: [
          {
            operator: 'lte',
            threshold_value: '',
            discount_type: 'percent',
            discount_value: '',
            sort_order: 0,
          }
        ]
      });
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
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'threshold_type') {
        const defaultOperator = value === 'remaining_days' ? 'lte' : 'gte';
        updated.tiers = prev.tiers.map(tier => ({
          ...tier,
          operator: defaultOperator
        }));
      }
      return updated;
    });
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index][field] = value;
    setFormData(prev => ({ ...prev, tiers: newTiers }));
  };

  const addTier = () => {
    setFormData(prev => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          operator: prev.threshold_type === 'remaining_days' ? 'lte' : 'gte',
          threshold_value: '',
          discount_type: 'percent',
          discount_value: '',
          sort_order: prev.tiers.length,
        }
      ]
    }));
  };

  const removeTier = (index) => {
    if (formData.tiers.length === 1) return;
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, tiers: newTiers }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.tiers.length === 0) {
      toast.error('Vui lòng thêm ít nhất một bậc giảm giá');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { ...formData };

      // Clean up payload
      if (payload.scope !== 'category') delete payload.category;
      if (payload.scope !== 'dealer_product') delete payload.dealer_product;

      if (payload.category === '') delete payload.category;
      if (payload.dealer_product === '') delete payload.dealer_product;
      payload.start_at = payload.start_at ? new Date(payload.start_at).toISOString() : null;
      payload.end_at = payload.end_at ? new Date(payload.end_at).toISOString() : null;

      await discountService.create(payload);
      toast.success('Tạo chính sách giảm giá thành công');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating discount policy:', error);
      toast.error(error.response?.data?.detail || 'Lỗi khi tạo chính sách');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Tạo mã giảm giá theo hạn sử dụng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Thông tin chung */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin chung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên chính sách giảm giá</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="VD: Giảm giá xả kho cận date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phạm vi áp dụng</label>
                  <select
                    name="scope"
                    value={formData.scope}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Giảm tất cả sản phẩm</option>
                    <option value="category">Giảm theo danh mục</option>
                    <option value="dealer_product">Giảm sản phẩm cụ thể</option>
                  </select>
                </div>

                {formData.scope === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn danh mục muốn giảm giá</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</label>
                    <select
                      name="dealer_product"
                      value={formData.dealer_product}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.title || prod.supplier_product_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên so với các chính sách khác</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500 italic">* Số càng nhỏ ưu tiên càng cao</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu (Tùy chọn)</label>
                  <input
                    type="datetime-local"
                    name="start_at"
                    value={formData.start_at}
                    min={getMinDateTime()}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc (Tùy chọn)</label>
                  <input
                    type="datetime-local"
                    name="end_at"
                    value={formData.end_at}
                    min={formData.start_at || getMinDateTime()}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Điều kiện giảm giá */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Cấu hình bậc giảm giá</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại điều kiện xét duyệt</label>
                <select
                  name="threshold_type"
                  value={formData.threshold_type}
                  onChange={handleChange}
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="remaining_days">Số ngày còn lại trước khi hết hạn</option>
                </select>
              </div>

              <div className="space-y-4">
                {formData.tiers.map((tier, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Điều kiện</label>
                      <select
                        value={tier.operator}
                        onChange={(e) => handleTierChange(index, 'operator', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        {formData.threshold_type === 'remaining_days' ? (
                          <>
                            <option value="lte">&lt;= (Nhỏ hơn hoặc bằng)</option>
                            <option value="lt">&lt; (Nhỏ hơn)</option>
                          </>
                        ) : (
                          <>
                            <option value="gte">&gt;= (Lớn hơn hoặc bằng)</option>
                            <option value="gt">&gt; (Lớn hơn)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Giá trị mốc (ngày/%)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={tier.threshold_value}
                        onChange={(e) => handleTierChange(index, 'threshold_value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="VD: 30"
                      />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Loại giảm</label>
                      <select
                        value={tier.discount_type}
                        onChange={(e) => handleTierChange(index, 'discount_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="percent">% Phần trăm</option>
                        <option value="fixed">Số tiền cố định</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mức giảm</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={tier.discount_value}
                        onChange={(e) => handleTierChange(index, 'discount_value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="VD: 15"
                      />
                    </div>

                    {formData.tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTier}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                <Plus size={16} /> Thêm bậc giảm giá
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex flex-col items-start gap-3 bg-white rounded-b-xl">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Áp dụng giảm giá ngay
              </label>
            </div>
            <div className="flex justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu chính sách'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

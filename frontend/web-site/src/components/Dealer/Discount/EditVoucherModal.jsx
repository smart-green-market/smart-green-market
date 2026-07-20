import React, { useState, useEffect } from 'react';
import { Clock, X, Loader2 } from 'lucide-react';
import { voucherService } from '../../../services/api/voucherService';
import { customerSegmentService } from '../../../services/api/customerSegmentService';
import { loyaltyService } from '../../../services/api/loyaltyService';
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
    schedule_type: 'date_range',
    daily_start_time: '09:00',
    daily_end_time: '12:00',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalStartDate, setOriginalStartDate] = useState('');

  const [segments, setSegments] = useState([]);
  const [loyaltyTiers, setLoyaltyTiers] = useState([]);

  const [audienceType, setAudienceType] = useState('ALL');
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);

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
      const [segmentsData, tiersData, data] = await Promise.all([
        customerSegmentService.getAll({ limit: 100 }).catch(() => ({ results: [] })),
        loyaltyService.getTiers().catch(() => ({ results: [] })),
        voucherService.getById(voucherId),
      ]);

      setSegments(Array.isArray(segmentsData) ? segmentsData : segmentsData?.results || []);
      setLoyaltyTiers(Array.isArray(tiersData) ? tiersData : tiersData?.results || []);

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
        schedule_type: data.schedule_type || 'date_range',
        daily_start_time: data.daily_start_time ? data.daily_start_time.slice(0, 5) : '09:00',
        daily_end_time: data.daily_end_time ? data.daily_end_time.slice(0, 5) : '12:00',
      });

      setAudienceType(data.audience_type || 'ALL');
      setSelectedTiers(data.loyalty_tiers?.map((t) => t.id) || []);
      setSelectedSegments(data.customer_segments?.map((s) => s.id) || []);
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

    if (formData.schedule_type === 'daily_time') {
      if (!formData.daily_start_time || !formData.daily_end_time) {
        toast.error('Vui lòng nhập đầy đủ khung giờ flash sale');
        return;
      }
      if (formData.daily_start_time === formData.daily_end_time) {
        toast.error('Giờ bắt đầu và giờ kết thúc flash sale phải khác nhau');
        return;
      }
    }

    if (audienceType === 'LOYALTY_TIER' && selectedTiers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một hạng thành viên áp dụng');
      return;
    }

    if (audienceType === 'CUSTOMER_SEGMENT' && selectedSegments.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhóm phân khúc áp dụng');
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
        min_order_amount: Number(formData.min_order_amount || 0),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        schedule_type: formData.schedule_type,
        audience_type: audienceType,
        loyalty_tier_ids: audienceType === 'LOYALTY_TIER' ? selectedTiers.map(Number) : [],
        customer_segment_ids: audienceType === 'CUSTOMER_SEGMENT' ? selectedSegments.map(Number) : [],
      };

      if (formData.schedule_type === 'daily_time') {
        payload.daily_start_time = formData.daily_start_time;
        payload.daily_end_time = formData.daily_end_time;
      } else {
        payload.daily_start_time = null;
        payload.daily_end_time = null;
      }

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

  const getAudienceSummaryText = () => {
    if (audienceType === 'ALL') {
      return 'Tất cả khách hàng';
    }
    if (audienceType === 'LOYALTY_TIER') {
      if (selectedTiers.length === 0) {
        return 'Hạng thành viên B2C (chưa chọn hạng cụ thể)';
      }
      const names = selectedTiers
        .map(id => loyaltyTiers.find(t => t.id === Number(id))?.name || `Hạng #${id}`)
        .filter(Boolean)
        .join(', ');
      return `Hạng thành viên B2C (${names})`;
    }
    if (audienceType === 'CUSTOMER_SEGMENT') {
      if (selectedSegments.length === 0) {
        return 'Phân khúc khách hàng (chưa chọn phân khúc cụ thể)';
      }
      const names = selectedSegments
        .map(id => segments.find(s => s.id === Number(id))?.name || `Phân khúc #${id}`)
        .filter(Boolean)
        .join(', ');
      return `Phân khúc khách hàng (${names})`;
    }
    return '';
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

            {/* Đối tượng áp dụng (Audience Targets) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Đối tượng áp dụng</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn kiểu đối tượng</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'ALL', label: 'Tất cả khách hàng' },
                      { value: 'LOYALTY_TIER', label: 'Hạng thành viên B2C' },
                      { value: 'CUSTOMER_SEGMENT', label: 'Phân khúc khách hàng' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAudienceType(opt.value)}
                        className={`px-3 py-2.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          audienceType === opt.value
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist for loyalty tiers */}
                {audienceType === 'LOYALTY_TIER' && (
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Chọn các Hạng thành viên được áp dụng:
                    </label>
                    {loyaltyTiers.length === 0 ? (
                      <p className="text-xs text-gray-400">Không có hạng thành viên nào.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {loyaltyTiers.map((tier) => {
                          const isChecked = selectedTiers.includes(tier.id);
                          return (
                            <label key={tier.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-neutral-50/50 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedTiers(selectedTiers.filter(id => id !== tier.id));
                                  } else {
                                    setSelectedTiers([...selectedTiers, tier.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 accent-green-600"
                              />
                              <span className="text-xs font-bold text-gray-700">{tier.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist for customer segments */}
                {audienceType === 'CUSTOMER_SEGMENT' && (
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Chọn các Phân khúc khách hàng được áp dụng:
                    </label>
                    {segments.length === 0 ? (
                      <p className="text-xs text-gray-400">Không có nhóm phân khúc nào.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {segments.map((seg) => {
                          const isChecked = selectedSegments.includes(seg.id);
                          return (
                            <label key={seg.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-neutral-50/50 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedSegments(selectedSegments.filter(id => id !== seg.id));
                                  } else {
                                    setSelectedSegments([...selectedSegments, seg.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 accent-green-600"
                              />
                              <span className="text-xs font-bold text-gray-700">{seg.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Audience description helper */}
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
              Bạn đang chọn giảm giá cho: <span className="font-bold">{getAudienceSummaryText()}</span>
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
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu thời gian áp dụng</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, schedule_type: 'date_range' }))}
                      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                        formData.schedule_type === 'date_range'
                          ? 'border-green-500 bg-white text-green-700 shadow-sm'
                          : 'border-gray-200 bg-white/70 text-gray-600 hover:border-green-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">Theo khoảng ngày</div>
                      <div className="text-xs mt-1">Voucher chạy liên tục từ ngày bắt đầu đến ngày kết thúc.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, schedule_type: 'daily_time' }))}
                      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                        formData.schedule_type === 'daily_time'
                          ? 'border-orange-500 bg-white text-orange-700 shadow-sm'
                          : 'border-gray-200 bg-white/70 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Clock size={15} />
                        Flash sale hằng ngày
                      </div>
                      <div className="text-xs mt-1">Trong khoảng ngày đã chọn, mỗi ngày chỉ chạy theo khung giờ.</div>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.schedule_type === 'daily_time' ? 'Ngày bắt đầu chiến dịch' : 'Thời gian bắt đầu'}
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.schedule_type === 'daily_time' ? 'Ngày kết thúc chiến dịch' : 'Thời gian kết thúc'}
                    </label>
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

                  {formData.schedule_type === 'daily_time' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu mỗi ngày</label>
                        <input
                          type="time"
                          name="daily_start_time"
                          required
                          value={formData.daily_start_time}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc mỗi ngày</label>
                        <input
                          type="time"
                          name="daily_end_time"
                          required
                          value={formData.daily_end_time}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </>
                  )}
                </div>
                {formData.schedule_type === 'daily_time' && (
                  <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mt-3">
                    Voucher chỉ khả dụng mỗi ngày từ {formData.daily_start_time || '...'} đến {formData.daily_end_time || '...'} trong khoảng ngày chiến dịch.
                  </p>
                )}
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

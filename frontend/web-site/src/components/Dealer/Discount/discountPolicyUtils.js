export const INITIAL_DISCOUNT_FORM = {
  title: '',
  scope: 'all',
  category: '',
  dealer_product: '',
  discount_type: 'percent',
  discount_value: '',
  priority: 0,
  is_active: true,
  daily_start_time: '07:00',
  daily_end_time: '10:00',
};

export const SCOPE_LABELS = {
  all: 'Tất cả sản phẩm',
  category: 'Theo danh mục',
  dealer_product: 'Sản phẩm cụ thể',
};

export const DISCOUNT_TYPE_LABELS = {
  percent: 'Giảm theo phần trăm',
  fixed: 'Giảm số tiền cố định',
};

export function normalizeIsActive(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function formatTimeForInput(timeStr) {
  if (!timeStr) return '';
  return String(timeStr).slice(0, 5);
}

export function formatTimeForApi(timeStr) {
  if (!timeStr) return null;
  const normalized = String(timeStr).slice(0, 5);
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

export function formatTimeDisplay(timeStr) {
  if (!timeStr) return '—';
  const [hour = '', minute = '00'] = String(timeStr).slice(0, 5).split(':');
  const hourNumber = Number(hour);
  if (Number.isNaN(hourNumber)) return String(timeStr).slice(0, 5);
  return minute === '00' ? `${hourNumber} giờ` : `${hourNumber}:${minute}`;
}

export function formatDiscountValue(policy) {
  if (!policy) return '';
  if (policy.discount_type === 'percent') {
    return `${parseFloat(policy.discount_value || 0)}%`;
  }
  return `${parseFloat(policy.discount_value || 0).toLocaleString('vi-VN')}đ`;
}

export function mapPolicyToFormData(data) {
  return {
    title: data.title || '',
    scope: data.scope || 'all',
    category: data.category != null ? String(data.category) : '',
    dealer_product: data.dealer_product != null ? String(data.dealer_product) : '',
    discount_type: data.discount_type || 'percent',
    discount_value: data.discount_value != null ? String(data.discount_value) : '',
    priority: data.priority ?? 0,
    is_active: normalizeIsActive(data.is_active),
    daily_start_time: formatTimeForInput(data.daily_start_time) || '07:00',
    daily_end_time: formatTimeForInput(data.daily_end_time) || '10:00',
  };
}

export function validateDiscountForm(formData) {
  if (!formData.title?.trim()) {
    return 'Vui lòng nhập tên chính sách';
  }

  if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
    return 'Vui lòng nhập mức giảm giá hợp lệ';
  }

  if (formData.discount_type === 'percent' && parseFloat(formData.discount_value) > 100) {
    return 'Phần trăm giảm giá không được vượt quá 100%';
  }

  if (formData.scope === 'category' && !formData.category) {
    return 'Vui lòng chọn danh mục áp dụng';
  }

  if (formData.scope === 'dealer_product' && !formData.dealer_product) {
    return 'Vui lòng chọn sản phẩm áp dụng';
  }

  if (!formData.daily_start_time || !formData.daily_end_time) {
    return 'Vui lòng nhập đầy đủ khung giờ áp dụng';
  }

  if (formData.daily_start_time === formData.daily_end_time) {
    return 'Giờ bắt đầu và giờ kết thúc phải khác nhau';
  }

  return null;
}

export function buildDiscountPolicyPayload(formData) {
  const payload = {
    title: formData.title.trim(),
    scope: formData.scope,
    discount_type: formData.discount_type,
    discount_value: formData.discount_value,
    priority: parseInt(formData.priority, 10) || 0,
    is_active: formData.is_active,
    start_at: null,
    end_at: null,
    daily_start_time: formatTimeForApi(formData.daily_start_time),
    daily_end_time: formatTimeForApi(formData.daily_end_time),
    category: null,
    dealer_product: null,
  };

  if (formData.scope === 'category') {
    payload.category = parseInt(formData.category, 10);
  } else if (formData.scope === 'dealer_product') {
    payload.dealer_product = parseInt(formData.dealer_product, 10);
  }

  return payload;
}

const FIELD_LABELS = {
  title: 'Tên chính sách',
  scope: 'Phạm vi',
  category: 'Danh mục',
  dealer_product: 'Sản phẩm',
  discount_type: 'Loại giảm giá',
  discount_value: 'Mức giảm',
  priority: 'Độ ưu tiên',
  is_active: 'Trạng thái',
  daily_start_time: 'Giờ bắt đầu',
  daily_end_time: 'Giờ kết thúc',
  start_at: 'Thời gian bắt đầu',
  end_at: 'Thời gian kết thúc',
  detail: 'Lỗi',
};

export function formatDiscountApiError(error) {
  const errData = error?.response?.data;
  if (!errData) return 'Đã xảy ra lỗi. Vui lòng thử lại.';

  if (typeof errData === 'string') return errData;
  if (errData.detail) return String(errData.detail);

  if (typeof errData === 'object') {
    return Object.entries(errData)
      .map(([key, val]) => {
        const label = FIELD_LABELS[key] || key;
        const message = Array.isArray(val) ? val.join(', ') : String(val);
        return `${label}: ${message}`;
      })
      .join('\n');
  }

  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function handleScopeChange(prev, nextScope) {
  return {
    ...prev,
    scope: nextScope,
    category: nextScope === 'category' ? prev.category : '',
    dealer_product: nextScope === 'dealer_product' ? prev.dealer_product : '',
  };
}
